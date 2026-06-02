# Frontend Unit Test Plan
## Prana Clinical Management System

This document outlines our strategy for delivering a flawless, intuitive, and high-performance interface for healthcare professionals.

The testing methodology focuses on **component reliability, state management integrity, and seamless API orchestration**. By simulating real-world user interactions and stress-testing our UI logic, we ensure that Prana remains a dependable tool in a clinical environment.

---

## Key Quality Pillars
- **UI/UX Stability**: Validating that every button, form, and modal behaves predictably.
- **State Integrity**: Ensuring our custom hooks and contexts maintain a consistent "Source of Truth".
- **Interaction Security**: Verifying that client-side guards and redirects are impenetrable.

## 🏷️ Test Type: Frontend (FE-UT)
 
>**Legends:**<br>
✅ Happy Path &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 💥 Failure <br>
🚫 Invalid &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🧩 Edge Case <br>
🔒 Security &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ✅ UI / Interaction

### Services & Utilities — `authService.js`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-01** | ✅<br>Happy Path | `login` | Successful login returns `response.data` | `authService.js` | Mock: 200 OK | `{ username, password }` | Returns data from server | Verifies POST to `/login` |
| **FE-UT-02** | 💥<br>Failure | `login` | API rejects login — error propagated | `authService.js` | Mock: 401 | Invalid credentials | Promise rejects with error | Error not swallowed |
| **FE-UT-03** | ✅<br>Happy Path | `signup` | Successful signup returns `response.data` | `authService.js` | Mock: 201 | Valid user object | Returns data from server | POST to `/signup` |
| **FE-UT-04** | 💥<br>Failure | `signup` | Duplicate email — error propagated | `authService.js` | Mock: 400, "already registered" | Existing email | Promise rejects with error | Service relays API error |
| **FE-UT-05** | ✅<br>Happy Path | `getAccount` | Fetch profile returns user data | `authService.js` | Mock: 200 | N/A (GET) | Returns user object | GET `/account` |
| **FE-UT-06** | 💥<br>Failure | `getAccount` | Unauthorized fetch — error propagated | `authService.js` | Mock: 401 | N/A (GET) | Promise rejects | Error not swallowed |
| **FE-UT-07** | ✅<br>Happy Path | `updateAccount` | Profile update returns updated data | `authService.js` | Mock: 200 | `{ fullName: "New" }` | Returns updated user | PUT `/account` |
| **FE-UT-08** | 💥<br>Failure | `updateAccount` | Server rejects update | `authService.js` | Mock: 400 | Invalid data | Promise rejects | Error propagated |
| **FE-UT-09** | ✅<br>Happy Path | `deleteAccount` | Deletion returns confirmation | `authService.js` | Mock: 200 | N/A (DELETE) | Returns success response | DELETE `/account` |
| **FE-UT-10** | 💥<br>Failure | `deleteAccount` | Deletion fails | `authService.js` | Mock: 500 | N/A (DELETE) | Promise rejects | Error propagated |
| **FE-UT-11** | ✅<br>Happy Path | `requestPasswordReset` | Sends email request | `authService.js` | Mock: 200 | `"test@email.com"` | Returns data (message) | POST `/forgot-password` |
| **FE-UT-12** | 💥<br>Failure | `requestPasswordReset` | Unknown email — error | `authService.js` | Mock: 404 | Unknown email | Promise rejects | Error propagated |
| **FE-UT-13** | ✅<br>Happy Path | `verifyPasswordReset` | GET with id & token in query | `authService.js` | Mock: 200 | `id="x", token="y"` | Returns `response.data` | Correct URL construction; **Note:** Frontend calls `/reset-password` but backend expects `/reset-password-verify` — verify URL alignment |
| **FE-UT-14** | 💥<br>Failure | `verifyPasswordReset` | Invalid token — error | `authService.js` | Mock: 401 | Invalid token | Promise rejects | Error propagated |
| **FE-UT-15** | ✅<br>Happy Path | `performPasswordReset` | POST new password with id & token | `authService.js` | Mock: 200 | `{ id, token, newPassword }` | Returns `response.data` | Endpoint & payload verified; **Note:** Frontend calls `/reset-password` but backend expects `/reset-password-action` — verify URL alignment |
| **FE-UT-16** | 💥<br>Failure | `performPasswordReset` | Token expired — error | `authService.js` | Mock: 401 | Expired token | Promise rejects | Error propagated |
| **FE-UT-17** | ✅<br>Happy Path | `deactivateAccount` | Deactivation returns confirmation | `authService.js` | Mock: 200 | N/A (POST) | Returns success response | POST `/deactivate` |
| **FE-UT-18** | 💥<br>Failure | `deactivateAccount` | Deactivation fails | `authService.js` | Mock: 500 | N/A (POST) | Promise rejects | Error propagated |
| **FE-UT-19** | ✅<br>Happy Path | `logout` | Logout returns response data | `authService.js` | Mock: 200 | N/A (POST) | Returns data | POST `/logout` |
| **FE-UT-20** | 💥<br>Failure | `logout` | Logout fails — error propagated | `authService.js` | Mock: 500 | N/A (POST) | Promise rejects | Error not swallowed |
| **FE-UT-21** | ✅<br>Happy Path | `verifyPasswordReset` | URL encoded correctly with both params | `authService.js` | Mock: 200 | `id="abc", token="xyz"` | GET `/reset-password?id=abc&token=xyz` | Query string construction |
| **FE-UT-22** | 🧩<br>Edge Case | `performPasswordReset` | Full payload forwarded | `authService.js` | Mock: 200 | `{ id, token, newPassword }` | Request body matches input | No fields dropped in transit |

### Services & Utilities — `apiClient.js`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-23** | ✅<br>Happy Path | `apiClient` | Base URL configured correctly | `apiClient.js` | N/A | N/A | `baseURL` matches env or default | Axios instance creation |
| **FE-UT-24** | 🔒<br>Security | `responseInterceptor` | 401 on protected page → redirect `/login` | `apiClient.js` | `pathname !== '/login'` & `!== '/'` | API returns 401 | `window.location.href = '/login'` | Session invalidated |
| **FE-UT-25** | 🧩<br>Edge Case | `responseInterceptor` | 401 on `/login` page → no redirect | `apiClient.js` | `pathname === '/login'` | API returns 401 | No redirect, error propagated | Bypass condition for `/login` |
| **FE-UT-26** | 🧩<br>Edge Case | `responseInterceptor` | 401 on `/` page → no redirect | `apiClient.js` | `pathname === '/'` | API returns 401 | No redirect, error propagated | Bypass condition for landing page |
| **FE-UT-27** | 💥<br>Failure | `responseInterceptor` | 403 status → error propagated | `apiClient.js` | Any path | API returns 403 | Error passes through interceptor | Not a redirect case |
| **FE-UT-28** | 💥<br>Failure | `responseInterceptor` | 500 status → error propagated | `apiClient.js` | Any path | API returns 500 | Error passes through interceptor | Standard error flow |
| **FE-UT-29** | 💥<br>Failure | `responseInterceptor` | Network error (no response) → error propagated | `apiClient.js` | Server unreachable | Any request | Error with `undefined` response | `error.response` is undefined |

### Services & Utilities — `auth.js`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-30** | ✅<br>Happy Path | `isAuthenticated` | API returns 200 → returns `true` | `auth.js` | Mock: GET `/check-auth` → 200 | N/A | Returns `true` | Used in `App.jsx` `useEffect` |
| **FE-UT-31** | 💥<br>Failure | `isAuthenticated` | API rejects → returns `false` | `auth.js` | Mock: GET `/check-auth` → 401 | N/A | Returns `false` | Catch block returns `false` |
| **FE-UT-32** | ✅<br>Happy Path | `logout` | API returns 200 → returns `true` | `auth.js` | Mock: POST `/logout` → 200 | N/A | Returns `true` | Distinct from `authService.logout` |
| **FE-UT-33** | 💥<br>Failure | `logout` | API fails → returns `false` | `auth.js` | Mock: POST `/logout` → 500 | N/A | Returns `false` | Catch block returns `false` |

### Services & Utilities — `patientService.js`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-34** | ✅<br>Happy Path | `createPatient` | POST patient data, returns `response.data` | `patientService.js` | Mock: 201 | Full patient object | Returns created patient | POST `/new-entry` |
| **FE-UT-35** | 💥<br>Failure | `createPatient` | Validation fails — error propagated | `patientService.js` | Mock: 400 | Missing required fields | Promise rejects | Error propagated |
| **FE-UT-36** | ✅<br>Happy Path | `getPatient` | GET patient by name, returns data | `patientService.js` | Mock: 200 | `patientName` | Returns patient object | GET `/patient/:name` |
| **FE-UT-37** | ✅<br>Happy Path | `updatePatient` | PUT patient data, returns response | `patientService.js` | Mock: 200 | Updated fields | Returns updated data | PUT `/update/:name` |
| **FE-UT-38** | ✅<br>Happy Path | `deletePatient` | DELETE patient, returns response | `patientService.js` | Mock: 200 | `patientName` | Returns success | DELETE `/patient/:name` |
| **FE-UT-39** | ✅<br>Happy Path | `searchPatients` | GET with query, returns match list | `patientService.js` | Mock: 200, `[{name: "A"}]` | `"A"` | Returns `[{name: "A"}]` | GET `/api/search-patients?query=A` |
| **FE-UT-40** | 💥<br>Failure | `getPatient` | Patient not found — error propagated | `patientService.js` | Mock: 404 | Unknown name | Promise rejects | Error propagated |
| **FE-UT-41** | 💥<br>Failure | `updatePatient` | Update fails — error propagated | `patientService.js` | Mock: 500 | Valid data | Promise rejects | Error propagated |
| **FE-UT-42** | 💥<br>Failure | `deletePatient` | Delete fails — error propagated | `patientService.js` | Mock: 500 | Valid name | Promise rejects | Error propagated |
| **FE-UT-43** | 💥<br>Failure | `searchPatients` | Search fails — error propagated | `patientService.js` | Mock: 500 | Any query | Promise rejects | Error propagated |

### Custom Hook — `usePatientForm.js`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-44** | ✅<br>Happy Path | `parseTreatments` | Formatted string parsed correctly | `usePatientForm.js` | N/A | `["Tab-500mg-[M,E]-5d-AfterFood"]` | Parsed into `{ name, dose, schedule, duration, instructions }` | Prefix "Tab" parsed |
| **FE-UT-45** | 🧩<br>Edge Case | `parseTreatments` | Non-array input → returns `[]` | `usePatientForm.js` | N/A | `null` | `[]` | Defensive fallback |
| **FE-UT-46** | 🧩<br>Edge Case | `parseTreatments` | No type prefix → defaults to "Tab" | `usePatientForm.js` | N/A | `["Aspirin-500mg-[]-5d-"]` | Type is "Tab" | Fallback when part[0] doesn't match known types |
| **FE-UT-47** | 🧩<br>Edge Case | `parseTreatments` | Dose suffix "mg" stripped for input | `usePatientForm.js` | N/A | `["Tab-500mg-[M]-5d-"]` | `dose` field is `"500"` | Regex parsing of numeric dose |
| **FE-UT-48** | ✅<br>Happy Path | `parseInvestigationDetails` | Array of objects parsed correctly | `usePatientForm.js` | N/A | `{ mri: [{ region: "Spine" }] }` | Returns `[{ region: "Spine", id: ... }]` | ID generated for each item |
| **FE-UT-49** | 🧩<br>Edge Case | `parseInvestigationDetails` | Single object with region → wrapped in array | `usePatientForm.js` | N/A | `{ mri: { region: "Brain" } }` | Returns `[{ region: "Brain", id: ... }]` | Object normalization |
| **FE-UT-50** | 🧩<br>Edge Case | `parseInvestigationDetails` | Investigation type not in details → `[]` | `usePatientForm.js` | N/A | `{ ct: [{ region: "Head" }] }` for key `mri` | Returns `[]` | Missing key fallback |
| **FE-UT-51** | 🚫<br>Invalid Input | `isFormValid` | Returns false when required fields empty | `usePatientForm.js` | Empty formData | `{ name: "", age: "", allergies: "" }` | `false` | Minimum data threshold |
| **FE-UT-52** | ✅<br>Happy Path | `isFormValid` | Returns true when all required fields filled | `usePatientForm.js` | N/A | `{ name: "A", age: "5", allergies: "No", examdate, phone: "1234567890" }` | `true` | Complete data check |
| **FE-UT-53** | 🚫<br>Invalid Input | `isFormValid` | Phone 9 digits → invalid | `usePatientForm.js` | N/A | `phone: "123456789"` | `false` | Regex: `/^\d{10}$/` |
| **FE-UT-54** | ✅<br>Happy Path | `handleInputChange` | Updates correct field in formData | `usePatientForm.js` | N/A | `{ target: { name: "name", value: "X" } }` | `formData.name === "X"` | Generic field update |
| **FE-UT-55** | 🧩<br>Edge Case | `handleInputChange` | Sets `hasChanges = true` in edit mode | `usePatientForm.js` | `mode = "edit"` | Any field change | `state.hasChanges === true` | Change tracking in edit mode |
| **FE-UT-56** | ✅<br>Happy Path | `handleVitalsChange` | Nested BP field updated | `usePatientForm.js` | N/A | `field = "bp.systolic", value = "120"` | `formData.vitals.bp.systolic === "120"` | Nested object update |
| **FE-UT-57** | ✅<br>Happy Path | `handleVitalsChange` | Top-level vital updated | `usePatientForm.js` | N/A | `field = "pulse", value = "80"` | `formData.vitals.pulse === "80"` | Direct field update |
| **FE-UT-58** | 🧩<br>Edge Case | `handleVitalsChange` | Empty string clears vital | `usePatientForm.js` | Pulse was "80" | `field = "pulse", value = ""` | `formData.vitals.pulse === ""` | Allows clearing |
| **FE-UT-59** | ✅<br>Happy Path | `toggleComorbidity` | Selecting "None" clears all conditions | `usePatientForm.js` | Comorbidities: ["HTN"] | Toggle "None" | Comorbidities: ["None"] | Exclusive selection |
| **FE-UT-60** | ✅<br>Happy Path | `toggleComorbidity` | Deselecting "None" restores previous | `usePatientForm.js` | Comorbidities: ["None"] | Toggle "None" | Comorbidities: previous state | Restore logic |
| **FE-UT-61** | ✅<br>Happy Path | `toggleComorbidity` | Adding condition removes "None" | `usePatientForm.js` | Comorbidities: ["None"] | Toggle "HTN" | Comorbidities: ["HTN"] | Mutual exclusion |
| **FE-UT-62** | ✅<br>Happy Path | `toggleComorbidity` | Deselecting existing condition | `usePatientForm.js` | Comorbidities: ["HTN", "DM"] | Toggle "HTN" | Comorbidities: ["DM"] | Toggle off |
| **FE-UT-63** | 🧩<br>Edge Case | `addCustomComorbidity` | Empty input → no-op | `usePatientForm.js` | N/A | `""` | No change | Guard clause |
| **FE-UT-64** | ✅<br>Happy Path | `addCustomComorbidity` | Adds with "Other: " prefix | `usePatientForm.js` | N/A | `"Lupus"` | Comorbidities includes `"Other: Lupus"` | Custom entry format |
| **FE-UT-65** | 🧩<br>Edge Case | `addCustomComorbidity` | Duplicate guard — existing entry rejected | `usePatientForm.js` | "Other: Lupus" exists | `"Lupus"` | No duplicate added | Idempotency check |
| **FE-UT-66** | ✅<br>Happy Path | `removeCustomComorbidity` | Removes correct custom entry | `usePatientForm.js` | ["Other: Lupus", "HTN"] | Remove "Other: Lupus" | Comorbidities: ["HTN"] | Filter by name |
| **FE-UT-67** | 🚫<br>Invalid Input | `handleSubmit` | Empty comorbidities → validation error | `usePatientForm.js` | N/A | `comorbidities: []` | Toast error, no submit | Guard clause |
| **FE-UT-68** | 🚫<br>Invalid Input | `handleSubmit` | MRI selected, no region → error | `usePatientForm.js` | Investigations: ["MRI"] | MRI regions: `[]` | Toast error: "Add at least one region" | Investigation validation |
| **FE-UT-69** | 🚫<br>Invalid Input | `handleSubmit` | CT selected, no region → error | `usePatientForm.js` | Investigations: ["CT"] | CT regions: `[]` | Toast error | Investigation validation |
| **FE-UT-70** | 🚫<br>Invalid Input | `handleSubmit` | ENMG selected, no region → error | `usePatientForm.js` | Investigations: ["ENMG"] | ENMG regions: `[]` | Toast error | Investigation validation |
| **FE-UT-71** | 🚫<br>Invalid Input | `handleSubmit` | BP only systolic (no diastolic) → error | `usePatientForm.js` | N/A | `vitals.bp: { systolic: "120" }` | Toast error: "Both...required" | BP pair validation |
| **FE-UT-72** | ✅<br>Happy Path | `handleSubmit` | Valid form → `onSubmit` called with correct payload | `usePatientForm.js` | All required fields filled | Complete patient form | `onSubmit(submissionData)` called | Full submission flow |
| **FE-UT-73** | 💥<br>Failure | `handleSubmit` | `onSubmit` callback throws → error caught | `usePatientForm.js` | `onSubmit` mock throws | Complete patient form | Toast error shown | Catch block activation |
| **FE-UT-74** | ✅<br>Happy Path | `updateComorbidityDuration` | Updates duration for specific comorbidity | `usePatientForm.js` | comorbidityData: `[{name:"HTN", duration:""}]` | `name="HTN", duration="5 years"` | comorbidityData: `[{name:"HTN", duration:"5 years"}]` | Duration field update |
| **FE-UT-75** | ✅<br>Happy Path | `addMedicine` | Adds medicine with default values | `usePatientForm.js` | medicines: `[]` | Call `addMedicine()` | medicines: `[{ type:"Tab", name:"", dose:"", ... }]` | Default structure created |
| **FE-UT-76** | ✅<br>Happy Path | `removeMedicine` | Removes medicine by index | `usePatientForm.js` | medicines: `[med0, med1]` | `removeMedicine(0)` | medicines: `[med1]` | Index-based removal |
| **FE-UT-77** | ✅<br>Happy Path | `updateMedicine` | Updates field value at index | `usePatientForm.js` | medicines: `[{name:""}]` | `updateMedicine(0, "name", "Aspirin")` | medicines: `[{name:"Aspirin"}]` | Direct field update |
| **FE-UT-78** | ✅<br>Happy Path | `updateMedicine` | Schedule toggle — add time | `usePatientForm.js` | schedule: `["M"]` | `updateMedicine(0, "schedule", "E")` | schedule: `["M", "E"]` | Toggle adds if not present |
| **FE-UT-79** | ✅<br>Happy Path | `updateMedicine` | Schedule toggle — remove time | `usePatientForm.js` | schedule: `["M", "E"]` | `updateMedicine(0, "schedule", "M")` | schedule: `["E"]` | Toggle removes if already present |
| **FE-UT-80** | ✅<br>Happy Path | `toggleInvestigation` | Toggle on — adds investigation | `usePatientForm.js` | investigations: `[]` | `toggleInvestigation("MRI")` | investigations: `["MRI"]` | Add to list |
| **FE-UT-81** | ✅<br>Happy Path | `toggleInvestigation` | Toggle off — removes investigation | `usePatientForm.js` | investigations: `["MRI"]` | `toggleInvestigation("MRI")` | investigations: `[]` | Remove from list |
| **FE-UT-82** | ✅<br>Happy Path | `addMriRegion` | Adds MRI region with unique ID | `usePatientForm.js` | mriRegions: `[]` | `addMriRegion("Spine")` | mriRegions: `[{region:"Spine", id:...}]` | ID auto-generated |
| **FE-UT-83** | 🧩<br>Edge Case | `addMriRegion` | Empty region → no-op | `usePatientForm.js` | mriRegions: `[]` | `addMriRegion("")` | mriRegions: `[]` | Guard clause |
| **FE-UT-84** | ✅<br>Happy Path | `addCtRegion` | Adds CT region with contrast & ID | `usePatientForm.js` | ctRegions: `[]` | `addCtRegion("Head", "With Contrast")` | ctRegions: `[{region:"Head", contrast:"With Contrast", id:...}]` | Two-field addition |
| **FE-UT-85** | ✅<br>Happy Path | `addEnmgRegion` | Adds ENMG region with unique ID | `usePatientForm.js` | enmgRegions: `[]` | `addEnmgRegion("Upper Limb")` | enmgRegions: `[{region:"Upper Limb", id:...}]` | ID auto-generated |
| **FE-UT-86** | ✅<br>Happy Path | `addOtherInvestigation` | Enter key adds text to investigations | `usePatientForm.js` | N/A | `key="Enter", value="X-Ray"` | `investigations` includes "Others", `otherInvestigation` updated | Enter key handler |
| **FE-UT-87** | 🧩<br>Edge Case | `addOtherInvestigation` | Non-Enter key → no-op | `usePatientForm.js` | N/A | `key="a", value="X-Ray"` | No change | Only Enter key triggers |
| **FE-UT-88** | 🧩<br>Edge Case | Initial state | `examdate` formatted correctly from `initialData` | `usePatientForm.js` | `mode="edit"`, `initialData.examdate` = ISO string | ISO date string | `formData.examdate` matches `YYYY-MM-DDTHH:mm` format | Date parsing in initialization |

### Routing & Navigation — `App.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-89** | ✅<br>Happy Path | Routing | `/` renders Main (landing page) | `App.jsx` | Not authenticated | Navigate to `/` | `<Main />` rendered | Public route |
| **FE-UT-90** | ✅<br>Happy Path | Routing | `/login` renders Login | `App.jsx` | Not authenticated | Navigate to `/login` | `<Login />` rendered | Public route |
| **FE-UT-91** | ✅<br>Happy Path | Routing | `/signup` renders Signup | `App.jsx` | Not authenticated | Navigate to `/signup` | `<SignUp />` rendered | Public route |
| **FE-UT-92** | 🔒<br>Security | Routing | `/home` requires auth → redirect | `App.jsx` | `isAuth = false` | Navigate to `/home` | Redirect to `/login` | `PrivateRoute` guard |
| **FE-UT-93** | ✅<br>Happy Path | Routing | `/home` renders Home if authenticated | `App.jsx` | `isAuth = true` | Navigate to `/home` | `<HomePage />` rendered | Protected route |
| **FE-UT-94** | 🔒<br>Security | Routing | `/account` requires auth → redirect | `App.jsx` | `isAuth = false` | Navigate to `/account` | Redirect to `/login` | `PrivateRoute` guard |
| **FE-UT-95** | 🔒<br>Security | Routing | `/new-entry` requires auth → redirect | `App.jsx` | `isAuth = false` | Navigate to `/new-entry` | Redirect to `/login` | `PrivateRoute` guard |
| **FE-UT-96** | ✅<br>Happy Path | Routing | Unknown route → 404 page | `App.jsx` | Any auth state | Navigate to `/xyz` | `<NotFound />` rendered | Catch-all route |
| **FE-UT-97** | 🔒<br>Security | Routing | Authenticated user at `/login` → redirect `/home` | `App.jsx` | `isAuth = true` | Navigate to `/login` | Redirect to `/home` | Already-logged-in guard |
| **FE-UT-98** | ✅<br>Happy Path | Routing | `/forgot-password` renders ForgotPassword | `App.jsx` | Any auth state | Navigate to `/forgot-password` | `<ForgotPassword />` rendered | Public route |

### Auth Pages — `Signin.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-99** | ✅<br>Happy Path | `handleFormSubmission` | Successful login → toast + redirect | `Signin.jsx` | Mock: `login()` resolves `{authenticated:true}` | Username + password | Toast success, localStorage set, `<Navigate to="/home">` | Full success flow |
| **FE-UT-100** | 💥<br>Failure | `handleFormSubmission` | Login fails → toast error | `Signin.jsx` | Mock: `login()` resolves `{authenticated:false}` | Any credentials | Toast error with server message | `data.message` displayed |
| **FE-UT-101** | 💥<br>Failure | `handleFormSubmission` | API throws → catch toast | `Signin.jsx` | Mock: `login()` rejects | Any credentials | Toast error: API error message | `err.response?.data?.message` fallback |
| **FE-UT-102** | ✅<br>UI | `handleInputChange` | Input fields update formData state | `Signin.jsx` | N/A | Type in username field | `formData.username` updated | Controlled inputs |
| **FE-UT-103** | ✅<br>UI | Render | Forgot Password link navigates | `Signin.jsx` | Component rendered | Click "Forgot Password?" | Navigates to `/forgot-password` | `<Link to="/forgot-password">` |
| **FE-UT-104** | ✅<br>UI | Render | "Create Account" link navigates | `Signin.jsx` | Component rendered | Click "Create Account" | Navigates to `/signup` | `<Link to="/signup">` |
| **FE-UT-105** | ✅<br>UI | Render | "Go back" navigates to `/` | `Signin.jsx` | Component rendered | Click "Go back" | Navigates to `/` | `navigate("/")` |

### Auth Pages — `Signup.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-106** | ✅<br>Happy Path | `handleFormSubmission` | Valid data → toast success + redirect | `Signup.jsx` | Mock: `signup()` resolves | Valid form data | Toast success, redirect to `/login` after 1500ms | `setTimeout` + `setRedirect` |
| **FE-UT-107** | 🚫<br>Invalid Input | `handleFormSubmission` | Bad email format → client-side toast error | `Signup.jsx` | N/A | `email: "notanemail"` | Toast error: "valid email" | `emailRegex` test fails |
| **FE-UT-108** | 🚫<br>Invalid Input | `handleFormSubmission` | Short password → client-side toast error | `Signup.jsx` | N/A | `password: "abc"` | Toast error: "at least 8 characters" | `passwordRegex` test fails |
| **FE-UT-109** | 🚫<br>Invalid Input | `handleFormSubmission` | Passwords don't match → toast error | `Signup.jsx` | N/A | `password !== confirmPassword` | Toast error: "Passwords do not match" | Client-side check |
| **FE-UT-110** | 💥<br>Failure | `handleFormSubmission` | API rejects signup → catch toast | `Signup.jsx` | Mock: `signup()` rejects | Any valid form | Toast error: server message | `err.response?.data?.message` fallback |
| **FE-UT-111** | ✅<br>UI | `handleInputChange` | Username warning toast shown once | `Signup.jsx` | First character typed in username | Type "a" in username field | Warning toast with ⚠️ shown | `usernameWarnedRef` ensures one-time |
| **FE-UT-112** | ✅<br>UI | `handleInputChange` | Password tooltip appears when < 8 chars | `Signup.jsx` | N/A | `password: "abc"` | "Min 8 Chars" text visible | `passwordTooltip` state |
| **FE-UT-113** | ✅<br>UI | `handleInputChange` | Password tooltip disappears at 8+ chars | `Signup.jsx` | N/A | `password: "abcdefgh"` | Tooltip hidden | `passwordTooltip` set to false |

### Auth Pages — `PassForgot.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-114** | ✅<br>Happy Path | `ForgotPassword` | Submit email → toast success | `PassForgot.jsx` | Mock: `requestPasswordReset()` resolves | Valid email | Toast success with server message | Loading toast replaced |
| **FE-UT-115** | 💥<br>Failure | `ForgotPassword` | Submit email → API error toast | `PassForgot.jsx` | Mock: `requestPasswordReset()` rejects | Any email | Toast error | Error path |
| **FE-UT-116** | ✅<br>UI | `ResetPassword` | Verifying state shown initially | `PassForgot.jsx` | `verifying = true` | Component mount | "Verifying Security Token..." visible | Loading state |
| **FE-UT-117** | 🧩<br>Edge Case | `ResetPassword` | Missing id/token → redirect | `PassForgot.jsx` | N/A | No `id` or `token` in URL | Toast error + navigate to `/forgot-password` | Guard clause in useEffect |
| **FE-UT-118** | 💥<br>Failure | `ResetPassword` | Invalid token → redirect | `PassForgot.jsx` | Mock: `verifyPasswordReset()` rejects | Invalid token | Toast error + navigate to `/forgot-password` | Catch block in useEffect |
| **FE-UT-119** | ✅<br>Happy Path | `ResetPassword` | Valid token → form rendered | `PassForgot.jsx` | Mock: `verifyPasswordReset()` resolves | Valid id + token | Password reset form visible | `validToken = true` |
| **FE-UT-120** | 🚫<br>Invalid Input | `ResetPassword` | Passwords don't match → toast error | `PassForgot.jsx` | Valid token | `newPassword !== confirmPassword` | Toast error: "does not match" | Client-side validation |
| **FE-UT-121** | 🚫<br>Invalid Input | `ResetPassword` | Short password (< 8 chars) → toast error | `PassForgot.jsx` | Valid token | `newPassword: "abc"` | Toast error: "at least 8 characters" | Length check |
| **FE-UT-122** | ✅<br>Happy Path | `ResetPassword` | Success → toast + redirect to `/login` | `PassForgot.jsx` | Mock: `performPasswordReset()` resolves | Valid new password | Toast success + redirect after 1500ms | `setRedirect(true)` |
| **FE-UT-123** | ✅<br>UI | `ResetPassword` | Confirm field disabled when newPassword empty | `PassForgot.jsx` | Valid token | `newPassword: ""` | Confirm input has `disabled` prop | UX guard |
| **FE-UT-124** | ✅<br>UI | `ResetPassword` | Submit button disabled when confirm empty | `PassForgot.jsx` | Valid token | `confirmPassword: ""` | Submit button has `disabled` prop | UX guard |

### Dashboard — `Home.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-125** | ✅<br>Happy Path | `HomePage` | Fetches and displays doctor name | `Home.jsx` | Mock: `getAccount()` resolves `{fullName:"Doe"}` | N/A | "Dr. Doe's Workspace" rendered | useEffect fetch |
| **FE-UT-126** | 🧩<br>Edge Case | `HomePage` | Loading state before data arrives | `Home.jsx` | `getAccount()` pending | N/A | "Loading your workspace..." shown | Null name check |
| **FE-UT-127** | 💥<br>Failure | `HomePage` | getAccount fails → console.error only | `Home.jsx` | Mock: `getAccount()` rejects | N/A | Error logged, no crash | Graceful degradation |
| **FE-UT-128** | ✅<br>UI | `HomePage` | Dashboard cards link correctly | `Home.jsx` | Rendered | N/A | Cards link to `/new-entry`, `/account` | `<DashboardCard>` `to` prop |
| **FE-UT-129** | ✅<br>Happy Path | `handleLogout` | Logout success → clears state, navigates | `Home.jsx` | Mock: `logout()` returns `true` | Click Logout | localStorage cleared, cookie cleared, navigate `/` | Full logout flow |
| **FE-UT-130** | 💥<br>Failure | `handleLogout` | Logout fails → toast error | `Home.jsx` | Mock: `logout()` returns `false` | Click Logout | Toast error: "encountered an error" | Failure path |

### Search — `SearchBar.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-131** | ✅<br>Happy Path | `SearchBar` | Typing triggers debounced search | `SearchBar.jsx` | Mock: `searchPatients()` resolves | Type "Alice" | Results shown after 300ms debounce | `setTimeout` with 300ms |
| **FE-UT-132** | 🧩<br>Edge Case | `SearchBar` | Empty input clears results | `SearchBar.jsx` | Previous results shown | Clear input | `searchResults: []` | Guard in `handleSearches` |
| **FE-UT-133** | ✅<br>UI | `SearchBar` | Result click → navigate to patient | `SearchBar.jsx` | Results: `[{name:"Alice"}]` | Click on "Alice" | `<Navigate to="/patient/Alice">` | `handlePatientClick` |
| **FE-UT-134** | ✅<br>UI | `SearchBar` | No results → "No Registry Matches" | `SearchBar.jsx` | Mock returns `[]` | Type "zzz" | "No Registry Matches" message | Empty state UI |
| **FE-UT-135** | 💥<br>Failure | `SearchBar` | Search API fails → console.error | `SearchBar.jsx` | Mock: `searchPatients()` rejects | Type anything | Error logged, no crash | Graceful error handling |
| **FE-UT-136** | ✅<br>UI | `SearchBar` | Result snippet highlight | `SearchBar.jsx` | Results with matching fields | Type "Flu" | Matching term highlighted | `highlightRegex` + `getSnippet` |
| **FE-UT-137** | 🧩<br>Edge Case | `SearchBar` | Patient name with special chars → encoded URL | `SearchBar.jsx` | Results: `[{name:"A (2)"}]` | Click on "A (2)" | Navigate to `/patient/A%20(2)` | `encodeURIComponent` verification |

### Account — `ProfilePage.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-138** | ✅<br>Happy Path | `ProfilePage` | Loads and displays user data | `ProfilePage.jsx` | Mock: `getAccount()` resolves | N/A | All profile fields rendered | View mode |
| **FE-UT-139** | 🔒<br>Security | `ProfilePage` | Not logged in → redirect to `/login` | `ProfilePage.jsx` | `localStorage.isLoggedIn` missing | N/A | Redirect to `/login` | Client-side auth guard (UX only, not a security boundary) |
| **FE-UT-140** | ✅<br>UI | `ProfilePage` | Click "Edit Profile" → edit mode | `ProfilePage.jsx` | View mode | Click button | Input fields appear | `isEditing = true` |
| **FE-UT-141** | ✅<br>Happy Path | `handleSave` | Save → toast success + update state | `ProfilePage.jsx` | Mock: `updateAccount()` resolves | Updated fullName | Toast success, view mode restored | `setIsEditing(false)` |
| **FE-UT-142** | 💥<br>Failure | `handleSave` | Save fails → toast error | `ProfilePage.jsx` | Mock: `updateAccount()` rejects | Any data | Toast error: "Failed to update" | Error path |
| **FE-UT-143** | ✅<br>UI | `ProfilePage` | Cancel edit → returns to view mode | `ProfilePage.jsx` | Edit mode | Click "Cancel" | View mode restored | No save triggered |
| **FE-UT-144** | ✅<br>UI | `ProfilePage` | Username field disabled in edit | `ProfilePage.jsx` | Edit mode | N/A | Username input has `disabled` prop | Username is immutable |
| **FE-UT-145** | ✅<br>UI | `ProfilePage` | Email field disabled in edit | `ProfilePage.jsx` | Edit mode | N/A | Email input has `disabled` prop | Email is immutable |
| **FE-UT-146** | ✅<br>UI | `ProfilePage` | Qualifications CRUD works | `ProfilePage.jsx` | Edit mode | Add/remove qualifications | List updates correctly | Array state management |
| **FE-UT-147** | ✅<br>Happy Path | `performDelete` | Delete account → clears session, navigates | `ProfilePage.jsx` | Mock: `deleteAccount()` resolves | Confirm deletion | localStorage/cookie cleared, navigate to `/` | Full deletion flow |
| **FE-UT-148** | 💥<br>Failure | `performDelete` | Delete fails → toast error | `ProfilePage.jsx` | Mock: `deleteAccount()` rejects | Confirm deletion | Toast error with API message | Error path |
| **FE-UT-149** | ✅<br>UI | `toDelete` | Confirmation toast with Cancel/Confirm | `ProfilePage.jsx` | View mode | Click "Delete Account" | Toast with two buttons rendered | Toast confirmation pattern |
| **FE-UT-150** | ✅<br>Happy Path | `performDeactivate` | Deactivation → clears session, navigates | `ProfilePage.jsx` | Mock: `deactivateAccount()` resolves | Confirm deactivation | localStorage/cookie cleared, navigate to `/` | Full deactivation flow |
| **FE-UT-151** | 💥<br>Failure | `performDeactivate` | Deactivation fails → toast error | `ProfilePage.jsx` | Mock: `deactivateAccount()` rejects | Confirm deactivation | Toast error with API message | Error path |
| **FE-UT-152** | 🧩<br>Edge Case | `ProfilePage` | Deactivate button is currently disabled | `ProfilePage.jsx` | View mode | N/A | "Deactivate Account" button has `disabled={true}` | Feature not yet implemented — `disabled={true}` is hardcoded |

### Layout — `Navbar.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-153** | ✅<br>Happy Path | `Navbar` | Renders on non-hidden routes | `Navbar.jsx` | Path: `/account` | N/A | Navbar visible with links | Not in `hiddenRoutes` |
| **FE-UT-154** | 🧩<br>Edge Case | `Navbar` | Hidden on `/` | `Navbar.jsx` | Path: `/` | N/A | Returns `null` | `matchPath` match |
| **FE-UT-155** | 🧩<br>Edge Case | `Navbar` | Hidden on `/login` | `Navbar.jsx` | Path: `/login` | N/A | Returns `null` | `matchPath` match |
| **FE-UT-156** | 🧩<br>Edge Case | `Navbar` | Hidden on `/home` | `Navbar.jsx` | Path: `/home` | N/A | Returns `null` | `matchPath` match |
| **FE-UT-157** | ✅<br>UI | `Navbar` | Username prop displayed | `Navbar.jsx` | `username="doc1"` | N/A | "doc1" shown in Account link | Prop rendering |
| **FE-UT-158** | ✅<br>UI | `Navbar` | Logout button triggers `handleLogout` | `Navbar.jsx` | `handleLogout` mock | Click logout | `handleLogout` called | Event handler wiring |

### Patient Components — `PatientProfilePage.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-159** | ✅<br>Happy Path | `Patient` | Loads patient + doctor data | `PatientProfilePage.jsx` | Mock both APIs resolve | `patientId: "Alice"` | Patient view rendered | `Promise.all` fetch |
| **FE-UT-160** | 💥<br>Failure | `Patient` | Fetch fails → error message shown | `PatientProfilePage.jsx` | Mock: `getPatient()` rejects | Any patientId | Error text rendered | `setError(errorMessage)` |
| **FE-UT-161** | ✅<br>UI | `Patient` | Loading state | `PatientProfilePage.jsx` | APIs pending | N/A | "Accessing Registry..." shown | `loading = true` |
| **FE-UT-162** | ✅<br>Happy Path | `handlePrint` | Prints when profile complete | `PatientProfilePage.jsx` | `doctorProfile` has all fields | Click Print | `window.print()` called | Style injection + print |
| **FE-UT-163** | 🧩<br>Edge Case | `handlePrint` | Missing profile fields → toast error | `PatientProfilePage.jsx` | `department: null` | Click Print | Toast error listing missing fields | Profile completeness check |
| **FE-UT-164** | ✅<br>UI | `handleDelete` | Confirmation toast shown | `PatientProfilePage.jsx` | Patient loaded | Click Delete | Toast with Cancel/Confirm | Toast confirmation pattern |
| **FE-UT-165** | ✅<br>Happy Path | `performDelete` | Delete success → toast + navigate | `PatientProfilePage.jsx` | Mock: `deletePatient()` resolves | Confirm deletion | Toast success, navigate to `/home` | Full delete flow |
| **FE-UT-166** | 💥<br>Failure | `performDelete` | Delete fails → toast error | `PatientProfilePage.jsx` | Mock: `deletePatient()` rejects | Confirm deletion | Toast error | Error path |
| **FE-UT-167** | ✅<br>UI | `PatientView` | Version history modal opens | `PatientProfilePage.jsx` | Versions exist | Click "Versions" | Modal overlay rendered | `showVersions = true` |
| **FE-UT-168** | ✅<br>UI | `PatientView` | Version list → click version → detail view | `PatientProfilePage.jsx` | Versions: `[{changeSummary:"v1"}]` | Click version entry | Version detail rendered | `selectedVersion` set |
| **FE-UT-169** | 🧩<br>Edge Case | `PatientView` | No versions → "No previous versions" | `PatientProfilePage.jsx` | `versions: []` | Click Versions button | "No previous versions available." shown | Empty state |
| **FE-UT-170** | ✅<br>UI | `PatientView` | Edit button navigates to `/update/:name` | `PatientProfilePage.jsx` | Patient loaded | Click Edit | Navigate to `/update/Alice` with state | `navigate(url, {state: data})` |
| **FE-UT-171** | 🧩<br>Edge Case | `PatientView` | No patient data → fallback message | `PatientProfilePage.jsx` | `patientData: null` | N/A | "No patient data found" shown | Null guard |

### Patient Components — `PatientForm.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-172** | ✅<br>Happy Path | `PatientForm` | Create mode renders correctly | `PatientForm.jsx` | `mode="create"` | N/A | Title: "New Patient Entry", dark header | Mode-specific UI |
| **FE-UT-173** | ✅<br>Happy Path | `PatientForm` | Edit mode renders correctly | `PatientForm.jsx` | `mode="edit"`, `initialData` provided | N/A | Title: "Edit Patient Record", blue header | Mode-specific UI |
| **FE-UT-174** | ✅<br>UI | `PatientForm` | Submit button disabled when form invalid (create) | `PatientForm.jsx` | `mode="create"`, form empty | N/A | Submit button has `disabled` class | `!state.isFormValid` |
| **FE-UT-175** | ✅<br>UI | `PatientForm` | Submit button disabled when no changes (edit) | `PatientForm.jsx` | `mode="edit"`, no changes | N/A | Submit button has `disabled` class | `!state.hasChanges` |
| **FE-UT-176** | ✅<br>UI | `PatientForm` | Cancel navigates to `/home` | `PatientForm.jsx` | Any mode | Click "Cancel" | Navigate to `/home` | `navigate("/home")` |
| **FE-UT-177** | ✅<br>UI | `PatientForm` | All sections rendered | `PatientForm.jsx` | Any mode | N/A | GeneralInfo, Vitals, MedicalHistory, ClinicalFindings, TreatmentPlan, Investigations visible | Section composition |
| **FE-UT-178** | ✅<br>Happy Path | `PatientForm` | Form submit triggers `actions.handleSubmit` | `PatientForm.jsx` | Valid form | Submit form | `onSubmit` callback invoked | Form event wiring |
| **FE-UT-179** | ✅<br>UI | `PatientForm` | Create mode submit label | `PatientForm.jsx` | `mode="create"` | N/A | Button text: "Save Patient Record" | Mode-specific label |
| **FE-UT-180** | ✅<br>UI | `PatientForm` | Edit mode submit label | `PatientForm.jsx` | `mode="edit"` | N/A | Button text: "Save Changes" | Mode-specific label |
| **FE-UT-181** | ✅<br>UI | `PatientForm` | Create header styling | `PatientForm.jsx` | `mode="create"` | N/A | Header has `bg-slate-900` class | Mode-specific styling |
| **FE-UT-182** | ✅<br>UI | `PatientForm` | Edit header styling | `PatientForm.jsx` | `mode="edit"` | N/A | Header has `bg-blue-600` class | Mode-specific styling |
| **FE-UT-183** | 🧩<br>Edge Case | `PatientForm` | Default `initialData` is `{}` | `PatientForm.jsx` | No `initialData` prop | N/A | Form renders without errors | Default prop handling |

### Patient Pages — `NewEntry.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-184** | ✅<br>Happy Path | `handleCreate` | Create success → toast + navigate | `NewEntry.jsx` | Mock: `createPatient()` resolves | Valid patient data | Toast success, navigate to `/patient/:name` | Full create flow |
| **FE-UT-185** | 💥<br>Failure | `handleCreate` | Create fails → toast error | `NewEntry.jsx` | Mock: `createPatient()` rejects | Any data | Toast error: "error occurred while attempting to save" | Console.error + toast |

### Patient Pages — `Update` component
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-186** | ✅<br>Happy Path | `handleUpdate` | Update success → toast + navigate | `PatientProfilePage.jsx` | Mock: `updatePatient()` resolves; `location.state` has data | Updated patient data | Toast success, navigate to `/patient/:name` | Uses `submissionData.name` for URL |
| **FE-UT-187** | 💥<br>Failure | `handleUpdate` | Update fails → toast error | `PatientProfilePage.jsx` | Mock: `updatePatient()` rejects | Any data | Toast error: "Failed to update information." | Error path |

### Landing Page — `Main.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-188** | ✅<br>UI | `Main` | Renders "Prana" heading | `Main.jsx` | Component rendered | N/A | `<h1>` contains "Prana" text | Brand identity check |
| **FE-UT-189** | ✅<br>UI | `Main` | Login link navigates to `/login` | `Main.jsx` | Component rendered | N/A | `<Link to="/login">` rendered with "Login" text | `<Link>` target verified |
| **FE-UT-190** | ✅<br>UI | `Main` | Sign Up link navigates to `/signup` | `Main.jsx` | Component rendered | N/A | `<Link to="/signup">` rendered with "Sign Up" text | `<Link>` target verified |
| **FE-UT-191** | ✅<br>UI | `Main` | Subtitle and tagline rendered | `Main.jsx` | Component rendered | N/A | "Clinical Information Systems" and description text visible | Static content verification |

### 404 Page — `NotFound.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-192** | ✅<br>UI | `NotFound` | Renders 404 heading | `NotFound.jsx` | Component rendered | N/A | "404" text visible in `<h1>` | Direct component render test |
| **FE-UT-193** | ✅<br>UI | `NotFound` | Renders "Page Not Found" message | `NotFound.jsx` | Component rendered | N/A | "Page Not Found" text visible | User-facing error message |
| **FE-UT-194** | ✅<br>UI | `NotFound` | "Return to Home" link navigates to `/` | `NotFound.jsx` | Component rendered | N/A | `<Link to="/">` with "Return to Home" text | Navigation back to landing |
| **FE-UT-195** | ✅<br>UI | `NotFound` | Has `data-testid="not-found-page"` | `NotFound.jsx` | Component rendered | N/A | Container has `data-testid` attribute | Test hook present in source |

### App Lifecycle — `App.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-196** | 💥<br>Failure | `fetchUsername` | getAccount fails → console.error, no crash | `App.jsx` | Mock: `isAuthenticated()` → true; `getAccount()` rejects | N/A | Error logged via `console.error`, app renders without crash | `catch` block in `fetchUsername` |
| **FE-UT-197** | ✅<br>Happy Path | `fetchUsername` | getAccount succeeds → username set | `App.jsx` | Mock: `isAuthenticated()` → true; `getAccount()` → `{username:"doc1"}` | N/A | `user` state set to `"doc1"`, passed to `<Navbar>` | `setUser(data.username)` |
| **FE-UT-198** | 🧩<br>Edge Case | Silent ping | Backend wake-up ping fires and is silent on error | `App.jsx` | Mock: `apiClient.get('/')` rejects | N/A | No visible error, no toast, no crash | `.catch(() => {})` swallows error |
| **FE-UT-199** | ✅<br>Happy Path | `handleLoginSuccess` | Sets authenticated + fetches username | `App.jsx` | Mock: `getAccount()` → `{username:"doc1"}` | `onLoginSuccess` callback invoked | `authenticated = true`, `fetchUsername` called | Passed to `<Login>` as prop |

### Presentation Components — `PatientFormSections.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-200** | ✅<br>UI | `FormGroup` | Renders label with required asterisk | `PatientFormSections.jsx` | `required={true}` | `label="Name"` | Label "Name" with red `*` rendered | Shared utility component |
| **FE-UT-201** | ✅<br>UI | `FormGroup` | Renders label without asterisk when not required | `PatientFormSections.jsx` | `required={false}` | `label="Address"` | Label "Address" without `*` | Default `required=false` |
| **FE-UT-202** | ✅<br>UI | `GeneralInfo` | All required input fields rendered | `PatientFormSections.jsx` | Valid `formData`, `handleInputChange` mock | N/A | `name`, `age`, `phone`, `examdate` inputs present | 5 fields: name, age, phone, address, examdate |
| **FE-UT-203** | ✅<br>UI | `GeneralInfo` | Phone input enforces numeric-only via onInput | `PatientFormSections.jsx` | Component rendered | Type "abc123" in phone | Value becomes "123" (non-numeric stripped) | `onInput` handler with regex replace |
| **FE-UT-204** | ✅<br>UI | `Vitals` | All 4 vital fields rendered | `PatientFormSections.jsx` | Valid vitals object | N/A | Pulse, BP Systolic, BP Diastolic, SpO2 inputs present | Grid layout with 4 fields |
| **FE-UT-205** | ✅<br>UI | `Vitals` | "Only recorded values will be saved" hint visible | `PatientFormSections.jsx` | Component rendered | N/A | Hint text rendered | Optional section guidance |
| **FE-UT-206** | ✅<br>UI | `MedicalHistory` | Comorbidity buttons rendered for all options | `PatientFormSections.jsx` | Valid state + actions | N/A | All `COMORBIDITY_OPTIONS` rendered as buttons | Maps over constant array |
| **FE-UT-207** | ✅<br>UI | `MedicalHistory` | Selected comorbidity has `active` class | `PatientFormSections.jsx` | `comorbidities: [{name:"HTN"}]` | N/A | HTN button has `chip active` class | Conditional class application |
| **FE-UT-208** | ✅<br>UI | `MedicalHistory` | "Others" selected → custom input section visible | `PatientFormSections.jsx` | `comorbidities: [{name:"Others"}]` | N/A | "Specify Other Conditions" section rendered | Conditional render block |
| **FE-UT-209** | ✅<br>UI | `MedicalHistory` | "None" selected → italic message shown | `PatientFormSections.jsx` | `comorbidities: [{name:"None"}]` | N/A | "No co-morbidities recorded." text in italic | Special "None" display |
| **FE-UT-210** | ✅<br>UI | `MedicalHistory` | Allergy "yes" → textarea appears | `PatientFormSections.jsx` | `formData.allergies === "yes"` | N/A | `allergyDetails` textarea rendered | Conditional field display |
| **FE-UT-211** | ✅<br>UI | `MedicalHistory` | Allergy "no" → textarea hidden | `PatientFormSections.jsx` | `formData.allergies === "no"` | N/A | `allergyDetails` textarea NOT rendered | Conditional field hidden |
| **FE-UT-212** | ✅<br>UI | `MedicalHistory` | Custom comorbidity remove button (✕) shown | `PatientFormSections.jsx` | `comorbidities: [{name:"Other: Lupus"}]` | N/A | ✕ button rendered next to "Lupus" | Only for `Other:` prefixed items |
| **FE-UT-213** | ✅<br>UI | `ClinicalFindings` | All 3 textareas rendered | `PatientFormSections.jsx` | Valid `formData` | N/A | `chiefComplaints`, `examination`, `clinicalDiagnosis` textareas present | Section composition check |

### Presentation Components — `PatientFormDetails.jsx`
| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-UT-214** | ✅<br>UI | `MedTypeDropdown` | Renders selected type abbreviation | `PatientFormDetails.jsx` | `value="Tab"` | N/A | "Tab" displayed in button | Default display |
| **FE-UT-215** | ✅<br>UI | `MedTypeDropdown` | Click opens dropdown with all types | `PatientFormDetails.jsx` | Component rendered | Click dropdown button | All `MEDICINE_TYPES` shown in dropdown | `setOpen(true)` |
| **FE-UT-216** | ✅<br>UI | `MedTypeDropdown` | Selecting type calls onChange and closes | `PatientFormDetails.jsx` | Dropdown open | Click "Cap" option | `onChange("Cap")` called, dropdown closes | `setOpen(false)` after selection |
| **FE-UT-217** | 🧩<br>Edge Case | `MedTypeDropdown` | Click outside closes dropdown | `PatientFormDetails.jsx` | Dropdown open | Click outside | Dropdown closes | `document.addEventListener('click')` cleanup |
| **FE-UT-218** | ✅<br>UI | `TreatmentPlan` | "Medicines" toggle shows medicine cards | `PatientFormDetails.jsx` | `showMedicines=false` | Click "Medicines" button | Medicine section rendered, `addMedicine()` called if empty | Toggle + auto-add first medicine |
| **FE-UT-219** | ✅<br>UI | `TreatmentPlan` | "Notes" toggle shows textarea | `PatientFormDetails.jsx` | `showOtherTreatment=false` | Click "Notes" button | `otherDetails` textarea rendered | `setShowOtherTreatment(true)` |
| **FE-UT-220** | ✅<br>UI | `TreatmentPlan` | Medicine card has all fields | `PatientFormDetails.jsx` | `medicines: [defaultMedicine]` | N/A | Name, dose, dose unit, schedule buttons, days, instructions fields rendered | Full medicine card layout |
| **FE-UT-221** | ✅<br>UI | `TreatmentPlan` | Schedule buttons toggle active class | `PatientFormDetails.jsx` | `med.schedule: ["Morning"]` | N/A | "Morning" button has active class, others do not | `includes()` class check |
| **FE-UT-222** | ✅<br>UI | `TreatmentPlan` | Remove medicine button (✕) calls removeMedicine | `PatientFormDetails.jsx` | `medicines: [med0]` | Click ✕ | `removeMedicine(0)` called | Index-based removal |
| **FE-UT-223** | ✅<br>UI | `TreatmentPlan` | "+ Add Medication" button calls addMedicine | `PatientFormDetails.jsx` | Any state | Click "+ Add Medication" | `addMedicine()` called | Dashed border button |
| **FE-UT-224** | ✅<br>UI | `TreatmentPlan` | Dose unit dropdown has all options | `PatientFormDetails.jsx` | `medicines: [defaultMedicine]` | N/A | mg, mcd, gm, mg/mL, mg/kg options present | `<select>` options check |
| **FE-UT-225** | ✅<br>UI | `Investigations` | All investigation option buttons rendered | `PatientFormDetails.jsx` | Valid state | N/A | All `INVESTIGATION_OPTIONS` rendered | Maps over constant array |
| **FE-UT-226** | ✅<br>UI | `Investigations` | Selected investigation has active class | `PatientFormDetails.jsx` | `selectedInvestigations: ["MRI"]` | N/A | MRI button has dark active class | Conditional class |
| **FE-UT-227** | ✅<br>UI | `Investigations` | MRI selected → region input section shown | `PatientFormDetails.jsx` | `selectedInvestigations: ["MRI"]` | N/A | MRI region input and + button visible | Conditional section render |
| **FE-UT-228** | ✅<br>UI | `Investigations` | CT selected → region + contrast section shown | `PatientFormDetails.jsx` | `selectedInvestigations: ["CT"]` | N/A | CT region input, contrast buttons, + button visible | Two-field section |
| **FE-UT-229** | 🧩<br>Edge Case | `Investigations` | CT add button disabled when region or contrast empty | `PatientFormDetails.jsx` | `selectedInvestigations: ["CT"]` | Region empty or no contrast selected | + button has `disabled` prop | `disabled={!region \|\| !contrast}` |
| **FE-UT-230** | ✅<br>UI | `Investigations` | ENMG selected → region input section shown | `PatientFormDetails.jsx` | `selectedInvestigations: ["ENMG"]` | N/A | ENMG region input and + button visible | Conditional section render |
| **FE-UT-231** | ✅<br>UI | `Investigations` | "Others" selected → free-text input shown | `PatientFormDetails.jsx` | `selectedInvestigations: ["Others"]` | N/A | Dark-themed text input with "press Enter" placeholder | Custom investigation input |
| **FE-UT-232** | 🧩<br>Edge Case | `Investigations` | "Others" input in edit mode sets hasChanges | `PatientFormDetails.jsx` | `mode="edit"`, Others selected | Type in Others input | `setHasChanges(true)` called | Change tracking in edit mode |
| **FE-UT-233** | ✅<br>UI | `Investigations` | Selected investigations displayed as tags | `PatientFormDetails.jsx` | `selectedInvestigations: ["MRI", "CT"]` | N/A | Two tag pills rendered with ✕ remove buttons | Summary tag display |
| **FE-UT-234** | ✅<br>UI | `Investigations` | MRI tag shows regions in parentheses | `PatientFormDetails.jsx` | `investigationDetails.mri: [{region:"Spine"}]` | N/A | Tag shows "MRI (Spine)" | Detail-appended display |
| **FE-UT-235** | ✅<br>UI | `Investigations` | CT tag shows region with contrast info | `PatientFormDetails.jsx` | `investigationDetails.ct: [{region:"Head", contrast:"With Contrast"}]` | N/A | Tag shows "CT (Head [With Contrast])" | Multi-field detail display |
| **FE-UT-236** | ✅<br>UI | `Investigations` | Remove tag button filters out investigation | `PatientFormDetails.jsx` | `selectedInvestigations: ["MRI", "CT"]` | Click ✕ on MRI tag | `setSelectedInvestigations` called with `["CT"]` | Inline filter callback |
