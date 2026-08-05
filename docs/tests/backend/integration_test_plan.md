# Backend Integration Test Plan

## Overview
This document outlines the integration test strategy for the Prana clinical management system's backend. Integration tests verify the interaction between **routes, middleware, controllers, services, and the real database** through HTTP requests using `supertest`. Unlike unit tests which mock services/models, integration tests mock **only external side-effects** (email sending) and let all other layers interact with a real MongoDB instance (via `MongoMemoryServer`).

### Test Boundary
- **Real**: Express app (`server.js`), all middleware (`verifyUser`, `helmet`, `cors`, rate limiters), controllers, services, validators, Mongoose models, and an in-memory MongoDB
- **Mocked**: `nodemailer` (email transport) — external side-effect only

### Test Infrastructure
- **HTTP**: `supertest` against the imported Express `app` (no `app.listen()` needed)
- **Database**: `MongoMemoryServer` — fresh in-memory MongoDB per test suite
- **Auth**: Helper function to create a user and generate a valid JWT cookie for authenticated requests

>**Legends:**<br>
✅ Happy Path &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🚫 Invalid Input <br>
🧩 Edge Case &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 💥 Failure <br>
🔒 Security

---

## 1. Authentication — Signup (`POST /signup`)

Tests verify the full signup flow: HTTP request → rate limiter → controller → service → User model → MongoDB → response.

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Body | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-01** | ✅ | Signup → Success | Valid signup request creates a new user in the database | `POST /signup` | Empty database | `{ fullName: "Dr. Jane", email: "jane@clinic.com", username: "janedoc", password: "Secure@123", phoneNumber: "+919876543210" }` | `201` — `{ message: "Registration successful.", user: { id, username } }` | User is persisted in DB with hashed password |
| **BE-IT-02** | 🚫 | Signup → Duplicate Email | Attempt to register with an email that already exists | `POST /signup` | User with `jane@clinic.com` exists | Same email, different username | `400` — `{ message: "Email address is already registered." }` | Tests `authService.signupUser` duplicate check |
| **BE-IT-03** | 🚫 | Signup → Duplicate Username | Attempt to register with a username that already exists | `POST /signup` | User with username `janedoc` exists | Same username, different email | `400` — `{ message: "Username is already taken." }` | Tests username uniqueness |
| **BE-IT-04** | 🚫 | Signup → Duplicate Phone | Attempt to register with a phone number already in use | `POST /signup` | User with phone `+919876543210` exists | Same phone, different email/username | `400` — `{ message: "Phone number is already registered." }` | Tests phone uniqueness (sparse index) |
| **BE-IT-05** | 🧩 | Signup → Empty Phone | Register without phone number (optional field) | `POST /signup` | Empty database | `phoneNumber: ""` (empty string) | `201` — User created with `phoneNumber: undefined` | Tests `phoneNumber === ""` → `undefined` conversion in service |
| **BE-IT-06** | 🚫 | Signup → Missing Required Fields | Missing `fullName` or `password` | `POST /signup` | Empty database | `{ email: "a@b.com" }` (no fullName, password) | `500` — Internal server error (Mongoose validation) | Tests Mongoose schema validation passthrough |
| **BE-IT-07** | ✅ | Signup → Password Hashed | Verify the stored password is bcrypt-hashed, not plaintext | `POST /signup` | Empty database | Valid signup data | `201` — Querying DB directly shows `password` starts with `$2a$` or `$2b$` | Confirms bcrypt integration end-to-end |

---

## 2. Authentication — Login (`POST /login`)

Tests verify login flow: HTTP request → rate limiter → controller → service → bcrypt compare → JWT sign → cookie set → response.

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Body | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-08** | ✅ | Login → Success with Username | Valid login sets `httpOnly` cookie with JWT | `POST /login` | Registered user `janedoc` | `{ username: "janedoc", password: "Secure@123" }` | `200` — `{ message: "Login successful.", authenticated: true }`, `Set-Cookie: token=...` | Cookie has `httpOnly`, `maxAge=12h` |
| **BE-IT-09** | ✅ | Login → Success with Email | Login using email instead of username | `POST /login` | Registered user with `jane@clinic.com` | `{ username: "jane@clinic.com", password: "Secure@123" }` | `200` — `{ authenticated: true }`, cookie set | Tests `$or` query in `loginUser` |
| **BE-IT-10** | ✅ | Login → Success with Phone | Login using phone number | `POST /login` | Registered user with phone `+919876543210` | `{ username: "+919876543210", password: "Secure@123" }` | `200` — `{ authenticated: true }`, cookie set | Tests phone-based login via `$or` query |
| **BE-IT-11** | 🚫 | Login → Wrong Password | Correct username, wrong password | `POST /login` | Registered user `janedoc` | `{ username: "janedoc", password: "WrongPass" }` | `401` — `{ message: "Incorrect password. Please try again." }` | No cookie set |
| **BE-IT-12** | 🚫 | Login → Non-existent User | Username/email that doesn't exist | `POST /login` | Empty database | `{ username: "nobody", password: "any" }` | `401` — `{ message: "Invalid credentials. Please verify your username/email." }` | Tests user-not-found branch |
| **BE-IT-13** | 🚫 | Login → Missing Credentials | Empty body or missing fields | `POST /login` | N/A | `{}` or `{ username: "" }` | `400` — `{ message: "Username and password are required." }` | Tests controller-level validation |
| **BE-IT-14** | 🔒 | Login → Deactivated Account | User exists but `status === "deactivated"` | `POST /login` | User with `status: "deactivated"` | Valid credentials for deactivated user | `403` — `{ message: "This account has been deactivated. Please contact support for assistance." }` | Tests deactivation gate in `loginUser` |
| **BE-IT-15** | ✅ | Login → JWT Payload Correct | Verify JWT contains expected claims | `POST /login` | Registered user | Valid credentials | `200` — Decode the `token` cookie: `{ id, username, email, role }` all present, `exp` set to 12h | Tests JWT sign payload |

---

## 3. Authentication — Password Reset (`POST /forgot-password`, `GET /reset-password-verify`, `POST /reset-password-action`)

Tests verify the multi-step password reset flow with email (nodemailer mocked).

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Data | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-16** | ✅ | Forgot Password → Email Sent | Valid email triggers password reset flow | `POST /forgot-password` | Registered user, nodemailer mocked | `{ contact: "jane@clinic.com" }` | `200` — `{ message: "If this email is registered, a professional recovery link has been dispatched.", type: "email" }` | Verify `sendMail` was called with correct `to` address |
| **BE-IT-17** | 🔒 | Forgot Password → Non-existent Email | Email not in database still returns success | `POST /forgot-password` | No user with email | `{ contact: "unknown@x.com" }` | `200` — Same generic message | Anti-enumeration: `sendMail` NOT called |
| **BE-IT-18** | ✅ | Verify Token → Valid | Valid `id` and `token` pass verification | `GET /reset-password-verify` | User exists, token generated from `JWT_SECRET + user.password` | `?id=<userId>&token=<validToken>` | `200` — `{ valid: true }` | Tests `verifyPasswordReset` end-to-end |
| **BE-IT-19** | 🔒 | Verify Token → Invalid Token | Tampered or expired token | `GET /reset-password-verify` | User exists | `?id=<userId>&token=badToken` | `401` — `{ message: "Security token is invalid or has already been used." }` | Tests JWT verification failure |
| **BE-IT-20** | 🔒 | Verify Token → Non-existent User | Valid-looking token but user ID doesn't exist | `GET /reset-password-verify` | No user with given ID | `?id=<fakeId>&token=abc` | `401` — `{ message: "Security parameters are invalid." }` | Tests user-not-found in `verifyPasswordReset` |
| **BE-IT-21** | ✅ | Reset Password → Success | Valid token + new password changes the password in DB | `POST /reset-password-action` | User exists, valid token | `{ id, token, newPassword: "NewSecure@1" }` | `200` — `{ message: "Password updated successfully. You may now log in with your new credentials." }` | Old password no longer works; new password works (verify by subsequent login) |
| **BE-IT-22** | 🔒 | Reset Password → Token Invalidated After Use | Using the same token twice fails | `POST /reset-password-action` | Password already reset with this token | Same `{ id, token, newPassword }` | `401` — Error message | Token is derived from old password hash — once password changes, token becomes invalid |
| **BE-IT-23** | 🔒 | Reset Password → Invalid Token | Tampered token in reset action | `POST /reset-password-action` | User exists | `{ id, token: "tampered", newPassword: "X" }` | `401` — `{ message: "Security token is invalid, expired, or has already been used." }` | Tests JWT verify failure in `resetPassword` |

---

## 4. Authentication — Logout (`POST /logout`)

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Data | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-24** | ✅ | Logout → Cookie Cleared | Logout clears the `token` cookie | `POST /logout` | Authenticated (cookie set) | N/A | `200` — `{ message: "Session successfully terminated." }`, `Set-Cookie: token=; ...` (cleared) | Cookie attributes match login cookie attributes |
| **BE-IT-25** | 🧩 | Logout → Without Cookie | Calling logout without a cookie | `POST /logout` | No cookie | N/A | `200` — Same success response | Logout is idempotent — `clearCookie` doesn't error |

---

## 5. Authentication Middleware — `verifyUser`

Tests verify the JWT middleware across all protected routes.

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Data | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-26** | 🔒 | No Token → 401 | Accessing a protected route without a cookie | `GET /api/account` | No cookie set | N/A | `401` — `{ message: "Missing token" }` | Middleware blocks before controller |
| **BE-IT-27** | 🔒 | Invalid Token → 401 | Accessing a protected route with a tampered cookie | `POST /new-entry` | Cookie: `token=invalidGarbage` | Valid body | `401` — `{ message: "Invalid or expired token" }` | Tests JWT verify failure path |
| **BE-IT-28** | 🔒 | Expired Token → 401 | Token signed with very short expiry that has passed | Any protected route | Expired JWT in cookie | N/A | `401` — `{ message: "Invalid or expired token" }` | Tests JWT expiration handling |
| **BE-IT-29** | ✅ | Valid Token → Passes | Valid token sets `req.user` and continues to controller | `GET /api/account` | Valid JWT cookie | N/A | `200` — Account data returned | Confirms middleware → controller chain works |

---

## 6. Patient Management — Create (`POST /new-entry`)

Tests verify patient creation through the full stack: HTTP → middleware → controller → service → validator → Patient model → MongoDB.

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Body | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-30** | ✅ | Create Patient → Success | Create a patient with all required fields | `POST /new-entry` | Authenticated | `{ name: "John Doe", age: 45, phone: "9876543210", examdate: "2026-06-03", allergies: "No", comorbidities: ["None"] }` | `201` — `{ message: "Patient clinical record successfully archived." }` | Patient persisted in DB with `userId` set to authenticated user's ID |
| **BE-IT-31** | ✅ | Create Patient → Full Data | Create with all fields including vitals, treatments, investigations | `POST /new-entry` | Authenticated | Full patient payload with vitals, comorbidityData, investigationDetails, treatments array | `201` — Patient saved with all nested data intact | Tests complex nested document storage |
| **BE-IT-32** | 🚫 | Create Patient → Invalid Vitals | Patient data with out-of-range vitals (pulse > 300) | `POST /new-entry` | Authenticated | `vitals: { pulse: 999 }` | `500` — Error (Zod validation fails via `validateVitals`) | Tests `patientValidator.validateVitals` integration |
| **BE-IT-33** | 🚫 | Create Patient → Missing Required Field | Missing `name` (required by schema) | `POST /new-entry` | Authenticated | `{ age: 30, examdate: "2026-01-01", allergies: "No" }` (no `name`) | `500` — Error (Mongoose validation) | Tests schema-level required validation |
| **BE-IT-34** | 🚫 | Create Patient → Invalid Phone | Phone not matching 10-digit pattern | `POST /new-entry` | Authenticated | `{ ..., phone: "123" }` | `500` — Mongoose custom validator error | Tests `phone` field custom validator in Patient model |
| **BE-IT-35** | 🚫 | Create Patient → Negative Age | Age below 0 (violates `min: 0`) | `POST /new-entry` | Authenticated | `{ ..., age: -5 }` | `500` — Mongoose validation error | Tests `min: 0` constraint on `age` |
| **BE-IT-36** | 🔒 | Create Patient → Ownership | Verify patient is stored with authenticated user's `userId` | `POST /new-entry` | Authenticated as User A | Valid patient data | `201` — Query DB: `patient.userId === userA._id` | Confirms `req.user.id` propagation through controller → service → model |

---

## 7. Patient Management — Read (`GET /patient/:patientId`)

Tests verify patient retrieval with name-based lookup and user ownership.

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Data | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-37** | ✅ | Get Patient → Success | Retrieve a patient by name (URL-encoded) | `GET /patient/John%20Doe` | Authenticated, patient "John Doe" exists for this user | N/A | `200` — Full patient JSON with all fields | Tests case-insensitive regex lookup |
| **BE-IT-38** | 🔒 | Get Patient → Cross-user Isolation | User A cannot access User B's patient | `GET /patient/John%20Doe` | Patient belongs to User B; request from User A | N/A | `404` — `{ message: "Clinical record not found for the specified patient." }` | Tests `userId` filter in `getPatientByIdAndUserId` |
| **BE-IT-39** | 🚫 | Get Patient → Non-existent | Patient name not in database | `GET /patient/Nobody` | Authenticated | N/A | `404` — `{ message: "Clinical record not found for the specified patient." }` | Tests not-found branch |
| **BE-IT-40** | 🧩 | Get Patient → Case Insensitive | Retrieve "john doe" when stored as "John Doe" | `GET /patient/john%20doe` | Patient "John Doe" exists | N/A | `200` — Returns patient data | Tests `$regex` with `'i'` flag in service |
| **BE-IT-41** | 🧩 | Get Patient → Special Characters in Name | Name containing regex-sensitive characters | `GET /patient/O%27Brien%20(Jr.)` | Patient "O'Brien (Jr.)" exists | N/A | `200` — Returns patient | Tests `escapedId` regex escaping in `getPatientByIdAndUserId` |

---

## 8. Patient Management — Update (`PUT /update/:patientId`)

Tests verify patient update flow including version history creation.

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Body | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-42** | ✅ | Update Patient → Success | Update patient name and age | `PUT /update/John%20Doe` | Authenticated, patient exists | `{ name: "John Doe Updated", age: 46 }` | `200` — `{ message: "Clinical documentation updated successfully.", data: {...} }` | Returned data reflects updated values |
| **BE-IT-43** | ✅ | Update Patient → Version Created | Update creates a version snapshot of the old data | `PUT /update/John%20Doe` | Authenticated, patient exists | `{ chiefComplaints: "Updated complaints" }` | `200` — `data.versions` array has new entry with `versionDate` and `changeSummary` containing "Chief Complaints" | Tests version snapshot mechanism in `updatePatientEntry` |
| **BE-IT-44** | ✅ | Update Patient → Change Summary | Changed fields are listed in `changeSummary` | `PUT /update/John%20Doe` | Authenticated, patient exists | Change `name`, `age`, `examination` | `200` — `changeSummary` includes "Name", "Age", "Examination" | Tests field diff → human-readable summary |
| **BE-IT-45** | 🧩 | Update Patient → No Changes | Submitting same data as existing record | `PUT /update/John%20Doe` | Authenticated, patient exists | Same data as current record | `200` — `changeSummary === "Manual Update"` | Edge case: no diff detected |
| **BE-IT-46** | 🚫 | Update Patient → Non-existent | Update a patient that doesn't exist | `PUT /update/Nobody` | Authenticated | `{ age: 50 }` | `404` — `{ error: "Patient record not found." }` | Tests not-found branch |
| **BE-IT-47** | 🔒 | Update Patient → Cross-user Isolation | User A cannot update User B's patient | `PUT /update/John%20Doe` | Patient belongs to User B; request from User A | `{ age: 99 }` | `404` — Not found (filtered by `userId`) | Tests ownership guard |
| **BE-IT-48** | 🚫 | Update Patient → Invalid Vitals | Update with out-of-range vitals | `PUT /update/John%20Doe` | Authenticated, patient exists | `{ vitals: { spO2: 200 } }` | `500` — Zod validation error | Tests `validateVitals` integration on update path |
| **BE-IT-49** | ✅ | Update Patient → Field Whitelist | Attempt to inject `userId` or `_id` in update payload | `PUT /update/John%20Doe` | Authenticated, patient exists | `{ userId: "hackerID", _id: "fakeId", name: "Safe" }` | `200` — `userId` and `_id` remain unchanged in DB | Tests `allowedFields` whitelist in `updatePatientEntry` |

---

## 9. Patient Management — Delete (`DELETE /patient/:patientId`)

Tests verify patient deletion with ownership checks.

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Data | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-50** | ✅ | Delete Patient → Success | Delete an existing patient | `DELETE /patient/John%20Doe` | Authenticated, patient exists | N/A | `200` — `{ message: "Clinical patient record successfully purged from registry." }` | Patient no longer in DB |
| **BE-IT-51** | 🚫 | Delete Patient → Non-existent | Delete a patient that doesn't exist | `DELETE /patient/Nobody` | Authenticated | N/A | `404` — `{ message: "Record not found for deletion." }` | Tests not-found branch |
| **BE-IT-52** | 🔒 | Delete Patient → Cross-user Isolation | User A cannot delete User B's patient | `DELETE /patient/John%20Doe` | Patient belongs to User B; request from User A | N/A | `404` — Not found | Tests `userId` filter in `deletePatientEntry` |

---

## 10. Patient Management — Search (`GET /api/search-patients`)

Tests verify the multi-field search with user isolation.

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Query Params | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-53** | ✅ | Search → By Name | Search patients by name | `GET /api/search-patients` | Authenticated, patients exist | `?query=John` | `200` — Array containing patient with name matching "John" | Tests `name` regex field |
| **BE-IT-54** | ✅ | Search → By Clinical Diagnosis | Search by diagnosis text | `GET /api/search-patients` | Patient with `clinicalDiagnosis: "Migraine"` exists | `?query=Migraine` | `200` — Array with matching patient | Tests `clinicalDiagnosis` search field |
| **BE-IT-55** | ✅ | Search → By Phone Number | Search by patient phone | `GET /api/search-patients` | Patient with `phone: "9876543210"` exists | `?query=9876543210` | `200` — Matching patient returned | Tests `phone` search field |
| **BE-IT-56** | 🧩 | Search → No Results | Search query with no matches | `GET /api/search-patients` | Authenticated, patients exist | `?query=zzzznonexistent` | `200` — Empty array `[]` | Tests empty result handling |
| **BE-IT-57** | 🔒 | Search → Cross-user Isolation | Search does not return other users' patients | `GET /api/search-patients` | User A has "Alice", User B has "Bob" | Login as User A, `?query=Bob` | `200` — Empty array (Bob belongs to User B) | Tests `userId` filter in search |
| **BE-IT-58** | 🚫 | Search → Missing Query | No `query` parameter provided | `GET /api/search-patients` | Authenticated | No query string | `400` — `{ message: "Search query is required." }` | Tests controller-level validation |
| **BE-IT-59** | 🧩 | Search → Special Characters | Query containing regex special characters | `GET /api/search-patients` | Authenticated | `?query=O'Brien(Jr.)` | `200` — Results (if exist) or empty array, no regex crash | Tests `escapedQuery` in `searchPatientRecords` |
| **BE-IT-60** | ✅ | Search → Multi-field Match | Search term appears in multiple fields across different patients | `GET /api/search-patients` | Patient A: `name: "Headache Test"`, Patient B: `chiefComplaints: "severe headache"` | `?query=headache` | `200` — Both patients returned | Tests `$or` across all indexed fields |

---

## 11. User Account — Get Profile (`GET /api/account`)

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Data | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-61** | ✅ | Get Account → Success | Retrieve authenticated user's profile | `GET /api/account` | Authenticated | N/A | `200` — User object without `password` field | Tests `-password` projection |
| **BE-IT-62** | 🔒 | Get Account → No Password Leak | Ensure password is excluded from response | `GET /api/account` | Authenticated | N/A | `200` — Response body does NOT contain `password` key | Critical security check |

---

## 12. User Account — Update Profile (`PUT /api/account`)

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Body | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-63** | ✅ | Update Account → Success | Update full name and department | `PUT /api/account` | Authenticated | `{ fullName: "Dr. Jane Updated", department: "Neurosurgery" }` | `200` — `{ message: "Profile updated successfully", user: {...} }` | Updated fields persisted in DB |
| **BE-IT-64** | ✅ | Update Account → KMC Number | Set a unique KMC number | `PUT /api/account` | Authenticated, no other user has this KMC | `{ kmcNumber: "KMC12345" }` | `200` — KMC number saved | Tests KMC uniqueness check pass |
| **BE-IT-65** | 🚫 | Update Account → Duplicate KMC | Set a KMC number already used by another user | `PUT /api/account` | Another user has `KMC12345` | `{ kmcNumber: "KMC12345" }` | `400` — `{ message: "This KMC Number is already registered." }` | Tests `findOne({ kmcNumber, _id: { $ne } })` check |
| **BE-IT-66** | 🧩 | Update Account → Clear Phone | Set phone number to empty string | `PUT /api/account` | Authenticated, user has phone set | `{ phoneNumber: "" }` | `200` — `user.phoneNumber` is `undefined` in DB | Tests `phoneNumber === "" → undefined` branch |
| **BE-IT-67** | 🧩 | Update Account → Clear KMC | Set KMC to empty string | `PUT /api/account` | Authenticated, user has KMC set | `{ kmcNumber: "" }` | `200` — `user.kmcNumber` is `undefined` in DB | Tests `kmcNumber === "" → undefined` branch |
| **BE-IT-68** | ✅ | Update Account → Qualifications Array | Update qualifications list | `PUT /api/account` | Authenticated | `{ qualifications: ["MD", "DM Neurology"] }` | `200` — Qualifications array saved correctly | Tests array field update |
| **BE-IT-69** | 🧩 | Update Account → Partial Update | Only send one field; others should not change | `PUT /api/account` | Authenticated, user has fullName, department, etc. | `{ department: "Cardiology" }` | `200` — Only `department` changed, all other fields unchanged | Tests selective field update logic |

---

## 13. User Account — Delete (`DELETE /api/account`)

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Data | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-70** | ✅ | Delete Account → Success | Delete authenticated user's account | `DELETE /api/account` | Authenticated | N/A | `200` — `{ message: "Account deleted successfully" }`, cookie cleared | User removed from DB |
| **BE-IT-71** | 🧩 | Delete Account → User Not Found | Token valid but user already deleted | `DELETE /api/account` | Valid token but user manually removed from DB | N/A | `404` — `{ message: "User not found" }` | Edge case: concurrent deletion |

---

## 14. User Account — Deactivate (`POST /api/deactivate`)

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Data | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-72** | ✅ | Deactivate Account → Success | Deactivate authenticated user's account | `POST /api/deactivate` | Authenticated, `status: "active"` | N/A | `200` — `{ message: "Account deactivated successfully." }`, cookie cleared | `user.status` changed to `"deactivated"` in DB |
| **BE-IT-73** | ✅ | Deactivate → Login Blocked | After deactivation, login attempt should fail | `POST /login` | User deactivated via BE-IT-72 | Valid credentials | `403` — Deactivation message | Tests deactivation → login gate end-to-end |

---

## 15. Check Auth (`GET /api/check-auth`)

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Data | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-74** | ✅ | Check Auth → Authenticated | Valid token cookie present | `GET /api/check-auth` | Valid JWT cookie | N/A | `200` — `{ message: "Authenticated" }` | Tests inline JWT verify in `userRoutes.js` |
| **BE-IT-75** | 🔒 | Check Auth → No Token | No cookie present | `GET /api/check-auth` | No cookie | N/A | `401` — `{ message: "Not authenticated" }` | Tests missing token branch |
| **BE-IT-76** | 🔒 | Check Auth → Invalid Token | Tampered cookie | `GET /api/check-auth` | Cookie: `token=garbage` | N/A | `401` — `{ message: "Invalid token" }` | Tests JWT verify error branch |

---

## 16. Cross-cutting — Multi-step Workflows

Tests verify realistic multi-step scenarios that span multiple endpoints.

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoints | Preconditions | Flow | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-77** | ✅ | Full Lifecycle: Signup → Login → Create → Read → Update → Delete | Complete CRUD lifecycle in sequence | All | Empty database | 1. `POST /signup` 2. `POST /login` 3. `POST /new-entry` 4. `GET /patient/:name` 5. `PUT /update/:name` 6. `DELETE /patient/:name` | Each step succeeds; final `GET` returns 404 | End-to-end integration across all layers |
| **BE-IT-78** | ✅ | Password Reset → Login with New Password | Reset password then login using the new password | `POST /forgot-password`, `POST /reset-password-action`, `POST /login` | Registered user, nodemailer mocked | 1. Request reset 2. Perform reset 3. Login with new password | Login succeeds with new password | Multi-endpoint security workflow |
| **BE-IT-79** | ✅ | Deactivate → Attempt Login → Remains Blocked | Deactivated user cannot authenticate | `POST /api/deactivate`, `POST /login` | Authenticated user | 1. Deactivate 2. Attempt login | Login returns `403` | Deactivation persistence check |
| **BE-IT-80** | 🔒 | User Isolation End-to-End | Two users create patients; each can only see their own | All patient endpoints | Two registered users | 1. User A creates "Alice" 2. User B creates "Bob" 3. User A searches for "Bob" → empty 4. User B reads "Alice" → 404 | Cross-user data isolation holds across create, read, search, delete | Critical multi-tenant isolation test |

---

## 17. Root Endpoint & Middleware

| Test Case ID | Legend | Function | Test Scenario / Description | Endpoint | Preconditions | Request Data | Expected Response | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-IT-81** | ✅ | Root Endpoint → Health Check | `GET /` returns alive message | `GET /` | Server running | N/A | `200` — `"Prana Backend Server is Live and Running!"` | Basic health check |
| **BE-IT-82** | 🔒 | Helmet Headers | Responses include security headers | `GET /` | Server running | N/A | Response has `X-Content-Type-Options`, `X-Frame-Options`, etc. | Tests `helmet()` middleware |
| **BE-IT-83** | 🔒 | CORS Headers | Responses include correct CORS headers | `GET /` | Server running, `Origin` header sent | `Origin: http://localhost:5173` | `Access-Control-Allow-Origin: http://localhost:5173`, `Access-Control-Allow-Credentials: true` | Tests CORS config |
