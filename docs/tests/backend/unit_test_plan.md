# Backend Unit Test Plan
## Prana Clinical Management System

This document serves as the definitive roadmap for ensuring the technical excellence and clinical reliability of our server-side infrastructure. 

## Core Testing Objectives
- **Data Integrity**: Ensuring medical records are stored and retrieved with 100% accuracy.
- **Security Validation**: Hardening authentication middlewares and authorization boundaries.
- **Error Resilience**: Verifying graceful failure handling across all API endpoints.

## Test Type: Backend (BE-UT)

>**Legends:**<br>
✅ Happy Path &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🚫 Invalid Input <br>
🧩 Edge Case &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 💥 Failure <br>
🔒 Security


### Authentication & Authorization
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-UT-01** | ✅<br>Happy Path | `signup` | Successful registration | `authController.js` | User doesn't exist | Valid JSON (name, email, pwd) | 201 Created | Password hashed in DB |
| **BE-UT-02** | 🚫<br>Invalid Input | `signup` | Missing required fields | `authController.js` | N/A | Missing `password` or `email` | 400/500 Error | Schema validation check |
| **BE-UT-03** | 🧩<br>Edge Case | `signup` | Duplicate unique fields | `authController.js` | Email "a@b.com" exists | Signup with "a@b.com" | 400 Bad Request | "Email already taken" |
| **BE-UT-04** | 🧩<br>Edge Case | `authService` | Duplicate Phone | `authService.js` | Phone already registered | Valid signup payload | Error: "Phone...registered" | Unique field check |
| **BE-UT-05** | ✅<br>Happy Path | `login` | Successful login | `authController.js` | User exists & active | Correct credentials | 200 OK, Auth Cookie set | Token verified |
| **BE-UT-06** | 🚫<br>Invalid Input | `authService` | Incorrect Password | `authService.js` | User exists | Valid user, wrong pwd | Error: "Incorrect password" | Bcrypt comparison fail |
| **BE-UT-07** | 🔒<br> Security | `login` | Login to deactivated account | `authController.js` | Status is "deactivated" | Valid credentials | 403 Forbidden | Error: "This account has been deactivated..." |
| **BE-UT-08** | 💥<br>Failure | `login` | Internal Server Error | `authController.js` | Database unreachable | Valid credentials | 500 Internal Error | Generic failure message |
| **BE-UT-09** | ✅<br>Happy Path | `logout` | Cookie cleared | `authController.js` | Token cookie exists | POST `/logout` | 200 OK, Cookie cleared | Session terminated |
| **BE-UT-10** | 🧩<br>Edge Case | `logout` | No token cookie | `authController.js` | No token | POST `/logout` | 200 OK | Idempotent operation |
| **BE-UT-11** | ✅<br>Happy Path | `forgotPassword`| Template substitution | `authService.js` | Email exists in DB | Valid registered email | Link with `{{fullName}}` replaced | Mailer logic verified |
| **BE-UT-12** | 🚫<br>Invalid Input | `forgotPassword`| Email not found | `authService.js` | Email doesn't exist | Unregistered email | 404 Not Found | Error path |
| **BE-UT-13** | 💥<br>Failure | `forgotPassword` | Mailer service down | `authController.js` | Email exists | Valid registered email | 500 Internal Error | Unexpected error path |
| **BE-UT-14** | 💥<br>Failure | `authService` | requestPasswordReset — mailer throws internally | `authService.js` | Email exists in DB; `sendMail` throws | Valid registered email | Error propagated to controller | Service-layer mailer exception; not swallowed |
| **BE-UT-15** | ✅<br>Happy Path | `resetPasswordVerify` | Token verification | `authController.js` | Valid token/ID pair | `?id=123&token=abc` | 200 OK, `{valid: true}`| Success path |
| **BE-UT-16** | 🔒<br>Security | `resetPasswordVerify` | Invalid token (401) | `authController.js` | Token mismatch | `?id=123&token=wrong` | 401 Unauthorized | Invalid parameters message |
| **BE-UT-17** | 🔒<br>Security | `resetPasswordVerify` | User mismatch (403) | `authController.js` | Token for User A | `?id=UserB_ID&token=UserA_Tkn`| 403 Forbidden | Unauthorized message |
| **BE-UT-18** | ✅<br>Happy Path | `resetPasswordAction` | Password update | `authController.js` | Valid token/ID pair | `newPassword: "..."` | 200 OK | Password changed in DB |
| **BE-UT-19** | 🔒<br>Security | `authMiddleware`| Valid Token access | `verifyUser.js` | Valid JWT in cookie | Request protected route | next() called | req.user populated |
| **BE-UT-20** | 🔒<br>Security | `authMiddleware` | Malformed JWT token | `verifyUser.js` | Invalid string in cookie| Request protected route | 401 Unauthorized | Error logging triggered |
| **BE-UT-21** | 🔒<br>Security | `authMiddleware` | Missing token | `verifyUser.js` | No cookie provided | Request protected route | 401 Unauthorized | Access denied |
| **BE-UT-22** | 🚫<br>Invalid Input | `login` | User not found → 401 | `authController.js` | User doesn't exist | Valid-format credentials | 401 Unauthorized | `includes('credentials')` branch |
| **BE-UT-23** | 💥<br>Failure | `login` | Server error → 500 | `authController.js` | DB throws non-auth error | Valid credentials | 500 Internal Error | Fallback catch path |
| **BE-UT-24** | 🧩<br>Edge Case | `signup` | Username already taken → 400 | `authController.js` | Username exists | Unique email, taken username | 400 Bad Request | `includes('taken')` branch |
| **BE-UT-25** | ✅<br>Happy Path | `forgotPassword` | Returns generic 200 (email exists) | `authController.js` | Email registered | Valid registered email | 200 OK, generic message | Anti-enumeration: identical response always |
| **BE-UT-26** | 🔒<br>Security | `forgotPassword` | Anti-enumeration (email not found) | `authController.js` | Email NOT in DB | Unknown email | 200 OK, same generic message | Must NOT reveal registration status |
| **BE-UT-27** | 💥<br>Failure | `resetPasswordVerify` | Unknown error → fallback 401 | `authController.js` | Unexpected service error | Unknown error | 401, fallback message | Third catch branch |
| **BE-UT-28** | 🔒<br>Security | `resetPasswordAction` | Invalid token → 401 | `authController.js` | Token invalid | `id=123, token=bad` | 401, "Security parameters are invalid." | Specific error match |
| **BE-UT-29** | 🔒<br>Security | `resetPasswordAction` | Unauthorized attempt → 403 | `authController.js` | Token for different user | `id=UserB, token=UserA_token` | 403, "Unauthorized access attempt." | ID-mismatch branch |
| **BE-UT-30** | 💥<br>Failure | `resetPasswordAction` | Generic error → fallback 401 | `authController.js` | Unexpected service error | Any input | 401, fallback message | Third catch branch |
| **BE-UT-31** | 🧩<br>Edge Case | `authService` | Email already registered | `authService.js` | Email exists in DB | Same email, different username | Error: "Email address is already registered." | `existingUser.email === email` branch |
| **BE-UT-32** | 🧩<br>Edge Case | `authService` | Username already taken | `authService.js` | Username exists in DB | Different email, same username | Error: "Username is already taken." | `existingUser.username === username` branch |
| **BE-UT-33** | 🧩<br>Edge Case | `authService` | Empty phoneNumber treated as undefined | `authService.js` | N/A | `phoneNumber: ""` | No phone set; duplicate check skipped | Business logic line 14 |
| **BE-UT-34** | 🚫<br>Invalid Input | `authService` | loginUser — user not found | `authService.js` | User doesn't exist | Any credentials | Error: "Invalid credentials..." | `!foundUser` branch |
| **BE-UT-35** | 🔒<br>Security | `authService` | loginUser — deactivated user | `authService.js` | User status is "deactivated" | Correct credentials | Error: "This account has been deactivated..." | Status check before password compare |
| **BE-UT-36** | ✅<br>Happy Path | `authService` | JWT payload contains correct fields | `authService.js` | Valid user | Correct credentials | Token payload has `id, username, email, role` | Payload integrity check |
| **BE-UT-37** | 🔒<br>Security | `authService` | requestPasswordReset — email not found — silent | `authService.js` | Email NOT in DB | Unregistered email | Returns `true`, no email sent | Anti-enumeration branch (line 48) |
| **BE-UT-38** | 🚫<br>Invalid Input | `authService` | verifyPasswordReset — user not found | `authService.js` | User ID invalid | `id=invalid, token=x` | Error: "Security parameters are invalid." | `!user` branch |
| **BE-UT-39** | 💥<br>Failure | `authService` | verifyPasswordReset — JWT verify throws | `authService.js` | Token is malformed/expired | Valid user, bad token | Error propagated from `jwt.verify` | Exception from verify |
| **BE-UT-40** | 🔒<br>Security | `authService` | verifyPasswordReset — ID mismatch | `authService.js` | Token for User A | `id=UserB, token=UserA_token` | Error: "Unauthorized." | `decoded.id !== id` branch |
| **BE-UT-41** | 🚫<br>Invalid Input | `authService` | resetPassword — user not found | `authService.js` | User ID invalid | `id=invalid, token=x` | Error: "Security parameters are invalid." | `!user` branch |
| **BE-UT-42** | 🔒<br>Security | `authService` | resetPassword — ID mismatch | `authService.js` | Token for different user | `id=UserB, token=UserA_token` | Error: "Unauthorized access attempt." | `decoded.id !== id` branch |
| **BE-UT-43** | 🔒<br>Security | `authMiddleware` | Expired JWT → 401 | `verifyUser.js` | Expired token in cookie | Expired JWT | 401 Unauthorized | `TokenExpiredError` handling |
| **BE-UT-44** | 🔒<br>Security | `authMiddleware` | Token signed with wrong secret | `verifyUser.js` | Tampered token | JWT with wrong signature | 401 Unauthorized | `JsonWebTokenError` handling |
| **BE-UT-45** | ✅<br>Happy Path | `authMiddleware` | req.user populated with id and role | `verifyUser.js` | Valid JWT with role | Valid token | `req.user.id` and `req.user.role` set correctly | Payload propagation check |
| **BE-UT-46** | 🚫<br>Invalid Input | `authController` | Wrong credential format | `authController.js` | N/A | No body or null credentials | 400 Bad Request | `!req.body \|\| !req.body.username \|\| !req.body.password` check |
| **BE-UT-47** | 🔒<br>Security | `authRoutes` | Rate limiting | `authRoutes.js` | N/A | > X requests per min | 429 Too Many Requests | Rate limiter middleware; message: "Too many attempts. Try again later." |
| **BE-UT-48** | 🔒<br>Security | `authController` | JWT reset token re-use after password changed | `authController.js` | Password already reset, JWT still valid | Re-submit reset token with new password | 401 Unauthorized | Token invalidated because secret includes `user.password`; after password change, `jwt.verify` fails with wrong secret |
| **BE-UT-49** | 💥<br>Failure | `signup` | Generic 500 catch (non-registration error) | `authController.js` | DB throws unexpected error | Valid signup payload | 500 Internal Error | Covers the `else` branch in catch — error does not include 'registered' or 'taken' |

### User / Account Management
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-UT-50** | ✅<br>Happy Path | `getAccount` | Profile retrieval | `userController.js` | Authenticated | GET `/account` | 200 OK, User object | No password in response |
| **BE-UT-51** | 🔒<br>Security | `getAccount` | Unauthenticated access | `userController.js` | No `req.user` | GET `/account` | 400 Bad Request | Auth boundary |
| **BE-UT-52** | 💥<br>Failure | `getAccount` | User not found in DB | `userController.js` | Valid token, deleted user | GET `/account` | 404 Not Found | Orphaned token |
| **BE-UT-53** | ✅<br>Happy Path | `updateAccount` | Update Profile fields | `userController.js` | Authenticated | `fullName: "New Name"` | 200 OK, Updated user | Partial update verification |
| **BE-UT-54** | 💥<br>Failure | `updateAccount` | KMC Number Duplicate | `userController.js` | KMC exists for User B | User A sets KMC to B's | 400 Bad Request | Field uniqueness check |
| **BE-UT-55** | ✅<br>Happy Path | `deleteAccount` | User self-deletion | `userController.js` | Authenticated | DELETE `/account` | 200 OK, Msg: Success | User removed from DB |
| **BE-UT-56** | 💥<br>Failure | `deleteAccount` | DB error during account deletion | `userController.js` | Authenticated | DELETE `/account`, DB throws | 500 Internal Error | Unhandled exception in `User.findByIdAndDelete` |
| **BE-UT-57** | ✅<br>Happy Path | `deactivateAccount`| Account Deactivation | `userController.js` | Authenticated | POST `/deactivate` | 200 OK, Status: deactivated| Cookie cleared, access lost |
| **BE-UT-58** | 💥<br>Failure | `deactivateAccount` | DB error during deactivation | `userController.js` | Authenticated | POST `/deactivate`, DB throws | 500 Internal Error | `User.findByIdAndUpdate` throws; status not persisted |
| **BE-UT-59** | 🧩<br>Edge Case | `updateAccount` | Clear phone (empty string) | `userController.js` | Phone set | `phoneNumber: ""` | 200 OK, phone set to undefined | Empty string clears field |
| **BE-UT-60** | 🧩<br>Edge Case | `updateAccount` | Clear KMC (empty string) | `userController.js` | KMC set | `kmcNumber: ""` | 200 OK, KMC set to undefined | Empty string clears field |
| **BE-UT-61** | 🧩<br>Edge Case | `updateAccount` | Update own KMC (no false duplicate) | `userController.js` | User has KMC "K123" | Set `kmcNumber: "K123"` (same user) | 200 OK | `$ne: req.user.id` excludes self |
| **BE-UT-62** | ✅<br>Happy Path | `deleteAccount` | Session cookie cleared after deletion | `userController.js` | Authenticated | DELETE `/account` | 200 OK, Cookie cleared | `res.clearCookie('token')` is called in implementation |
| **BE-UT-63** | ✅<br>Happy Path | `check-auth` | Valid token → 200 | `userRoutes.js` | Valid JWT in cookie | GET `/check-auth` | 200 OK, "Authenticated" | Inline route handler |
| **BE-UT-64** | 🔒<br>Security | `check-auth` | Missing token → 401 | `userRoutes.js` | No cookie | GET `/check-auth` | 401 Unauthorized | Inline route handler |
| **BE-UT-65** | 🔒<br>Security | `check-auth` | Invalid/expired token → 401 | `userRoutes.js` | Expired or tampered JWT | GET `/check-auth` | 401 Unauthorized | Uses `process.env.JWT_SECRET`; no hardcoded fallback |
| **BE-UT-66** | 💥<br>Failure | `updateAccount` | User not found in DB | `userController.js` | Valid token, deleted user | PUT `/account` | 404 Not Found | `!user` branch after `findById` |
| **BE-UT-67** | 💥<br>Failure | `updateAccount` | Generic DB error → 500 | `userController.js` | Authenticated, DB throws | PUT `/account` | 500 Internal Error | `catch(err)` block in `updateAccount` |
| **BE-UT-68** | 💥<br>Failure | `deactivateAccount` | User not found in DB | `userController.js` | Valid token, deleted user | POST `/deactivate` | 404 Not Found | `!user` branch after `findById` |
| **BE-UT-69** | 💥<br>Failure | `getAccount` | Generic DB error → 500 | `userController.js` | Authenticated, DB throws | GET `/account` | 500 Internal Error | `catch(err)` block in `getAccount` |

### Patient Management
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-UT-70** | ✅<br>Happy Path | `newEntry` | Nested Investigations | `Patient.js` | Authenticated user | CT with region/contrast | 201 Created | Nested object saved |
| **BE-UT-71** | ✅<br>Happy Path | `newEntry` | Save patient with vitals | `patientController.js` | Authenticated user | Vitals (Pulse: 80, SpO2: 98, BP: 120/80) | 201 Created | Verify vitals stored correctly |
| **BE-UT-72** | ✅<br>Happy Path | `getPatient` | Fetch own patient record | `patientController.js`| Record exists | Valid `patientId` | 200 OK, Data JSON | Verify all fields return |
| **BE-UT-73** | 🔒<br>Security | `getPatient` | Authorization check | `patientController.js`| Record for User B | User A requests B's patient | 404/403 Error | **Critical Privacy Test** |
| **BE-UT-74** | 💥<br>Failure | `getPatient` | API/DB connectivity issue | `patientController.js` | Mock DB failure | Valid `patientId` | 500 Internal Error | Graceful error handling |
| **BE-UT-75** | 💥<br>Failure | `getPatient` | Malformed ID | `patientController.js` | N/A | Invalid Mongo ID format | 400 Bad Request | Mongoose cast error |
| **BE-UT-76** | ✅<br>Happy Path | `updatePatient` | Partial update of vitals | `patientController.js` | Record exists | `vitals.pulse: 90` | 200 OK | Only pulse updated, others unchanged |
| **BE-UT-77** | 🔒<br>Security | `updatePatient` | Unauthorized vitals update | `patientController.js` | Record for User B | User A attempts update on B's record | 404/403 Error | Privacy boundary |
| **BE-UT-78** | ✅<br>Happy Path | `getPatientById` | Name Regex Search | `patientService.js` | Patient "John Doe" exists| `patientId: "john doe"` | Returns patient record | Case-insensitivity check |
| **BE-UT-79** | ✅<br>Happy Path | `updatePatient` | Version History Pushed | `patientService.js` | Record exists | Modify `clinicalDiagnosis`| 200 OK, versions length +1 | Snapshotting logic |
| **BE-UT-80** | 🧩<br>Edge Case | `updatePatient` | Manual Update Summary | `patientService.js` | Record exists | Update without data changes | ChangeSummary: "Manual..." | Fallback summary |
| **BE-UT-81** | ✅<br>Happy Path | `deletePatient` | Clean Purge | `patientService.js` | Record exists | Valid `patientId` | Success return | Record removed from DB |
| **BE-UT-82** | 🚫<br>Invalid Input | `deletePatient` | Patient not found | `patientController.js` | No record | Valid `patientId` | 404 Not Found | Proper error response |
| **BE-UT-83** | ✅<br>Happy Path | `searchPatients` | Multi-field Search | `patientService.js` | Records with diagnosis | `query: "Flu"` | Returns matching records | Regex on diagnosis/exam |
| **BE-UT-84** | 🚫<br>Invalid Input | `searchPatients` | Missing Query | `patientController.js` | N/A | `?query=` (empty) | 400 Bad Request | Validation in controller |
| **BE-UT-85** | 💥<br>Failure | `newEntry` | Vitals validation error → 500 | `patientController.js` | Authenticated | Invalid vitals (e.g., `pulse: 999`) | 500 Internal Error | `validateVitals` throws inside service |
| **BE-UT-86** | 💥<br>Failure | `newEntry` | req.user missing → 401 | `patientController.js` | No auth context | No `req.user` object | 401 Unauthorized | Guard present — returns 401 via `!req.user \|\| !req.user.id` check |
| **BE-UT-87** | 🧩<br>Edge Case | `updatePatient` | Disallowed fields stripped from body | `patientService.js` | Record exists | `{ userId: "other", _id: "fake" }` in payload | 200 OK, `userId` unchanged in DB | Allowlist filter verified |
| **BE-UT-88** | 🧩<br>Edge Case | `getPatient` | patientId with regex special chars | `patientController.js` | Patient named "Alice (2)" exists | `patientId: "Alice (2)"` | 200 OK without crash | Regex escaping in `getPatientByIdAndUserId` |
| **BE-UT-89** | 🧩<br>Edge Case | `searchPatients` | Empty result returns [] not 404 | `patientController.js` | No matching records | `?query=zzz` | 200 OK, `[]` | Not an error condition |
| **BE-UT-90** | 🔒<br>Security | `searchPatients` | Regex injection attempt | `patientController.js` | Records exist | `?query=.*` | 200 OK, no crash, safe results | Escaping in `searchPatientRecords` |
| **BE-UT-91** | 🧩<br>Edge Case | `deletePatient` | patientId with leading `:` stripped | `patientController.js` | Record exists | `:patientName` format | 200 OK, record deleted | Line 41 `replace(/^:/, '')` logic |
| **BE-UT-92** | 🚫<br>Invalid Input | `createPatientEntry` | Vitals validation throws → propagates | `patientService.js` | N/A | Invalid vitals payload | Error thrown to controller | Service does not swallow error |
| **BE-UT-93** | 🧩<br>Edge Case | `updatePatientEntry` | Disallowed fields excluded from $set | `patientService.js` | Record exists | `{ _id: "fake", userId: "hijack" }` | `$set` does NOT contain disallowed keys | Allowlist field-filter |
| **BE-UT-94** | 🔒<br>Security | `searchPatientRecords` | Special-char query escaped correctly | `patientService.js` | Records exist | `query: ".*"` | No regex injection; safe DB query | `escapedQuery` verified |
| **BE-UT-95** | 🧩<br>Edge Case | `searchPatientRecords` | Returns [] when no match (not error) | `patientService.js` | No matching records | Non-matching query | Returns `[]` | Not treated as failure |
| **BE-UT-96** | 🧩<br>Edge Case | `getPatientByIdAndUserId` | Name with regex special chars escaped | `patientService.js` | Patient "Alice (2)" exists | `patientId: "Alice (2)"` | Returns correct patient | `escapedId` regex escaping |
| **BE-UT-97** | 💥<br>Failure | `updatePatient` | Generic DB error → 500 | `patientController.js` | Authenticated, DB throws non-"not found" error | PUT `/update/:id` | 500 Internal Error | Fallback `catch` path in `updatePatient` |
| **BE-UT-98** | 💥<br>Failure | `deletePatient` | Generic DB error → 500 | `patientController.js` | Authenticated, DB throws non-"not found" error | DELETE `/patient/:id` | 500 Internal Error | Fallback `catch` path in `deletePatient` |
| **BE-UT-99** | 💥<br>Failure | `searchPatients` | Generic DB error → 500 | `patientController.js` | Authenticated, DB throws | GET `/api/search-patients?query=x` | 500 Internal Error | `catch` block in `searchPatients` |
| **BE-UT-100** | 🚫<br>Invalid Input | `updatePatientEntry` | Invalid vitals during update → throws | `patientService.js` | Record exists | `vitals: { pulse: 999 }` | Error thrown from `validateVitals` | Vitals validation runs on update path too |

### Models & Validators
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-UT-101** | ✅<br>Happy Path | `Patient` Model | Version array tracking | `Patient.js` | New patient creation | `versions: []` | Saved with empty versions | Base state |
| **BE-UT-102** | 🚫<br>Invalid Input | `Patient` Model | Invalid Investigation type | `Patient.js` | N/A | CT data in MRI field | Validation error | Mongoose does not reject extra fields by default; verify `strict` mode |
| **BE-UT-103** | 🚫<br>Invalid Input | `Patient` Model | Vitals bounds check | `Patient.js` | N/A | Pulse: 350, SpO2: 110 | Validation Error | Zod/Mongoose constraints — test both validation layers |
| **BE-UT-104** | ✅<br>Happy Path | `Patient` Model | Phone validation (10d) | `Patient.js` | N/A | `phone: "9876543210"` | Validation passes | Regex test success |
| **BE-UT-105** | 🚫<br>Invalid Input | `validateVitals` | BP Missing Diastolic | `patientValidator.js` | N/A | BP Sys: 120, Dia: null | Validation Error | Both Sys and Dia must be present |
| **BE-UT-106** | 🚫<br>Invalid Input | `validateVitals` | BP Missing Systolic | `patientValidator.js` | N/A | BP Sys: null, Dia: 80 | Validation Error | Both Sys and Dia must be present |
| **BE-UT-107** | 🧩<br>Edge Case | `validateVitals` | null input passes (nullable schema) | `patientValidator.js` | N/A | `validateVitals(null)` | No error thrown | Schema is `.nullable()` |
| **BE-UT-108** | 🚫<br>Invalid Input | `validateVitals` | Non-numeric type for pulse | `patientValidator.js` | N/A | `pulse: "fast"` | Zod ZodError thrown | Type coercion failure |
| **BE-UT-109** | 🚫<br>Invalid Input | `validateVitals` | Negative pulse (lower bound) | `patientValidator.js` | N/A | `pulse: -10` | ZodError: too_small | `.min(0)` constraint |
| **BE-UT-110** | 🚫<br>Invalid Input | `Patient` Model | Required fields missing | `Patient.js` | N/A | No `name`, `age`, `allergies`, `examdate`, `userId` | ValidationError | All required fields enforced by schema |
| **BE-UT-111** | 🚫<br>Invalid Input | `Patient` Model | Phone — 9-digit number rejected | `Patient.js` | N/A | `phone: "123456789"` | ValidationError: not valid 10-digit | Regex `/^\d{10}$/` fails |
| **BE-UT-112** | 🚫<br>Invalid Input | `Patient` Model | Phone — non-numeric string rejected | `Patient.js` | N/A | `phone: "abcdefghij"` | ValidationError | Regex: `/^\d{10}$/` fails |
| **BE-UT-113** | 🧩<br>Edge Case | `Patient` Model | Empty string phone allowed | `Patient.js` | N/A | `phone: ""` | Validation passes | `!v` short-circuit in validator |
| **BE-UT-114** | 🚫<br>Invalid Input | `Patient` Model | Invalid age type — string rejected | `Patient.js` | N/A | `age: "five"` | ValidationError | Age must be a Number |
| **BE-UT-115** | 🚫<br>Invalid Input | `Patient` Model | Invalid age — negative value rejected | `Patient.js` | N/A | `age: -1` | ValidationError | Age must be >= 0 |
| **BE-UT-116** | 🧩<br>Edge Case | `User` Model | Duplicate phoneNumber rejected by sparse unique index | `User.js` | Phone "9876543210" exists | Create second user with same phone | MongoServerError: duplicate key | Sparse unique index enforcement |

### App Base / Infrastructure
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-UT-117** | ✅<br>Happy Path | `Routes` | Route Registration | `allRoutes.js` | N/A | Import router | Router has `/auth`, `/patient`| Entry point check |
| **BE-UT-118** | ✅<br>Happy Path | `Server` | Root endpoint alive | `index.js` | Server running | GET `/` | 200 OK: "Server...Live" | Base health check |
| **BE-UT-119** | 🧩<br>Edge Case | `Routes` | Specific named routes registered | `allRoutes.js` | N/A | Inspect router stack | Stack contains `/` (auth), `/` (patient), `/api` (user) mount paths | Verify actual mount paths match `allRoutes.js` |
| **BE-UT-120** | 🔒<br>Security | `patientRoutes` | All patient routes use verifyUser middleware | `patientRoutes.js` | N/A | Inspect route stack | All 5 routes include `verifyUser` middleware | Middleware enforcement check |
| **BE-UT-121** | 🔒<br>Security | `authRoutes` | forgotPassword has separate rate limiter | `authRoutes.js` | N/A | > 5 requests per hour to `/forgot-password` | 429 Too Many Requests | Separate limiter: 5 req/hr vs 10/15min for login/signup |
| **BE-UT-122** | 🔒<br>Security | `index.js` | General rate limiter enforced | `index.js` | N/A | > 1000 requests per 15 min | 429 Too Many Requests | Global rate limiter applied to all routes |

### User Model
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BE-UT-123** | 🚫<br>Invalid Input | `User` Model | Required fields missing | `User.js` | N/A | No `fullName`, `email`, `username`, `password` | ValidationError | All required fields enforced |
| **BE-UT-124** | 🚫<br>Invalid Input | `User` Model | Invalid status enum value | `User.js` | N/A | `status: "suspended"` | ValidationError | Only `"active"` / `"deactivated"` allowed |
| **BE-UT-125** | 🧩<br>Edge Case | `User` Model | Duplicate email rejected by unique index | `User.js` | Email "a@b.com" exists | Create second user with same email | MongoServerError: duplicate key | Unique index enforcement |
