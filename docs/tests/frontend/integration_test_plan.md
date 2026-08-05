# Frontend Integration Test Plan

## Overview
This document outlines the integration test strategy for the Prana clinical management system's frontend. Integration tests verify the interaction between **multiple components, services, hooks, and the router** working together through realistic user workflows. Unlike unit tests which mock everything except the unit under test, integration tests mock **only the API boundary** (`apiClient`) and let all other layers interact for real.

### Mock Boundary
- **Mocked**: `apiClient` (axios instance) — network boundary only
- **Real**: All components, hooks (`usePatientForm`), services (`authService`, `patientService`), React Router (`MemoryRouter`), toast notifications, localStorage, and cookies

>**Legends:**<br>
✅ Happy Path &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 💥 Failure <br>
🚫 Invalid &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🧩 Edge Case <br>
🔒 Security &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 🖱️ UI / Interaction

---

## 1. Authentication Flow — Login

Tests verify the full login workflow: `Signin` → `authService.login()` → `apiClient` → state update → navigation.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-01** | ✅ | Login → Home Redirect | User submits valid credentials, receives authenticated response, and is redirected to `/home` | `Signin.jsx`, `authService.js`, `App.jsx` | App rendered at `/login`, user not authenticated | `{ username: "drjane", password: "Secure@123" }` | Success toast shown, `localStorage.isLoggedIn` set to `true`, `<Navigate to="/home">` triggered, Home page renders | Tests `onLoginSuccess` callback integration with App state |
| **FE-IT-02** | 💥 | Login → API Error | User submits credentials but API returns 401 with error message | `Signin.jsx`, `authService.js`, `apiClient.js` | App rendered at `/login` | `{ username: "wrong", password: "bad" }` | Error toast with server message "Invalid credentials...", user remains on login page, no localStorage changes | Verifies error propagation from apiClient through service to UI |
| **FE-IT-03** | 💥 | Login → Network Error | User submits credentials but network is unreachable | `Signin.jsx`, `authService.js`, `apiClient.js` | App rendered at `/login` | Valid credentials | Network error toast from apiClient interceptor ("Network error. Please check..."), user remains on login page | Tests apiClient interceptor → toast interaction |
| **FE-IT-04** | 🚫 | Login → Empty Fields | User tries to submit with empty username or password | `Signin.jsx` | App rendered at `/login` | Empty `username` and/or `password` | HTML5 `required` attribute prevents submission, no API call made | Browser-native validation; form `onSubmit` not triggered |
| **FE-IT-05** | 🔒 | Authenticated User → Login Redirect | Already authenticated user navigates to `/login` | `App.jsx`, `auth.js` | `isAuthenticated()` returns true | Direct navigation to `/login` | Automatically redirected to `/home` via `<Navigate to="/home">` | Tests the `authenticated ? <Navigate to="/home"> : <Login>` guard |

---

## 2. Authentication Flow — Signup

Tests verify the full signup workflow: `Signup` → `authService.signup()` → `apiClient` → redirect to `/login`.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-06** | ✅ | Signup → Success → Login Redirect | User fills all fields, submits, account is created, auto-redirected to login | `Signup.jsx`, `authService.js` | App rendered at `/signup` | `{ fullName: "Dr. Jane", email: "jane@clinic.com", username: "janedoe", countryCode: "+91", phoneDigits: "9876543210", password: "Secure@123", confirmPassword: "Secure@123" }` | Loading toast → Success toast "Account created successfully." → After 1.5s, `<Navigate to="/login">` triggered | Verifies `setTimeout` → redirect integration |
| **FE-IT-07** | 🚫 | Signup → Password Mismatch | User enters non-matching passwords | `Signup.jsx` | App rendered at `/signup` | password: "Abc@1234", confirmPassword: "Xyz@1234" | Error toast "Passwords do not match.", no API call made, form stays on signup | Client-side validation before API call |
| **FE-IT-08** | 🚫 | Signup → Invalid Email | User enters malformed email | `Signup.jsx` | App rendered at `/signup` | email: "not-an-email" | Error toast "Please enter a valid email address.", no API call made | Client-side regex validation |
| **FE-IT-09** | 🚫 | Signup → Short Password | User enters password shorter than 8 characters | `Signup.jsx` | App rendered at `/signup` | password: "Ab@1" | Error toast "Password must be at least 8 characters...", password tooltip visible ("Min 8 Chars") | Tests `passwordTooltip` state + validation interaction |
| **FE-IT-10** | 💥 | Signup → Duplicate Email/Username | API returns 400 with "Email already registered" | `Signup.jsx`, `authService.js` | App rendered at `/signup` | Valid form data with existing email | Error toast with server message, user stays on signup page | Tests error response propagation |
| **FE-IT-11** | 🖱️ | Signup → Username Warning Toast | User starts typing in the username field | `Signup.jsx` | App rendered at `/signup`, username field empty | First keystroke in username field | Warning toast "Note: Username cannot be changed once created." shown once via `usernameWarnedRef` | Should only fire once per component lifetime |

---

## 3. Authentication Flow — Password Reset

Tests verify the full forgot password → verify token → reset password multi-step workflow.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-12** | ✅ | Forgot Password → Request Sent | User enters email, API returns success message | `PassForgot.jsx (ForgotPassword)`, `authService.js` | App rendered at `/forgot-password` | email: "doctor@prana.com" | Loading toast → Success toast with server message | Tests `requestPasswordReset` → toast integration |
| **FE-IT-13** | ✅ | Reset Password → Full Flow | Valid token in URL → form shown → password reset → redirect to login | `PassForgot.jsx (ResetPasswordWrapper + ResetPassword)`, `authService.js` | App rendered at `/reset-password?id=abc&token=xyz`, `verifyPasswordReset` succeeds | newPassword: "NewPass@1", confirmPassword: "NewPass@1" | Verify spinner shown → form appears → submit → success toast → `<Navigate to="/login">` after 1.5s | Tests multi-step async state: verifying → validToken → redirect |
| **FE-IT-14** | 💥 | Reset Password → Invalid Token | Token verification fails | `PassForgot.jsx (ResetPassword)`, `authService.js` | App rendered at `/reset-password?id=abc&token=bad` | N/A | Error toast "Security token is invalid..." → after 2s, navigated to `/forgot-password` | Tests error state + delayed navigation |
| **FE-IT-15** | 🧩 | Reset Password → Missing Params | URL has no `id` or `token` query params | `PassForgot.jsx (ResetPassword)` | App rendered at `/reset-password` (no query params) | N/A | Error toast "Security parameters are missing." → navigated to `/forgot-password` | Edge case: direct URL access without params |
| **FE-IT-16** | 🚫 | Reset Password → Short Password | User enters password < 8 characters in reset form | `PassForgot.jsx (ResetPassword)` | Valid token verified, form visible | newPassword: "Ab1" | Error toast "Password must be at least 8 characters..." | Client-side validation on reset form |
| **FE-IT-17** | 🚫 | Reset Password → Password Mismatch | Confirm password doesn't match new password | `PassForgot.jsx (ResetPassword)` | Valid token verified, form visible | newPassword: "NewPass@1", confirmPassword: "Differ@2" | Error toast "Password confirmation does not match." | Client-side validation before API call |

---

## 4. Navigation & Route Guards

Tests verify the routing logic, authentication guards, and `Navbar` visibility behavior across the app.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-18** | 🔒 | Protected Route → Unauthenticated Redirect | Unauthenticated user accesses `/home`, `/account`, `/new-entry`, `/patient/:id`, `/update/:id` | `App.jsx`, `auth.js` | `isAuthenticated()` returns false | Navigate to any protected route | Redirected to `/login` via `<Navigate to="/login">` | Tests all 5 protected routes |
| **FE-IT-19** | ✅ | Landing Page → Login/Signup Links | User clicks "Login" and "Sign Up" buttons on Main landing page | `Main.jsx`, `App.jsx` | App rendered at `/` | Click "Login" link | Navigated to `/login`, Login form renders | Tests `<Link to="/login">` → Router integration |
| **FE-IT-20** | 🖱️ | Navbar Visibility — Hidden Routes | Navbar should NOT appear on `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/home` | `Navbar.jsx`, `App.jsx` | Render app at each hidden route | N/A | No `<nav>` element in the DOM | Tests `hiddenRoutes` + `matchPath` logic |
| **FE-IT-21** | 🖱️ | Navbar Visibility — Visible Routes | Navbar should appear on `/account`, `/patient/:id`, `/new-entry`, `/update/:id` | `Navbar.jsx`, `App.jsx` | Authenticated user navigates to visible routes | N/A | `<nav>` element present with Home, Account, and Logout links | Tests navbar rendering + username display |
| **FE-IT-22** | ✅ | 404 Page — Unknown Route | User navigates to a route that doesn't exist | `NotFound.jsx`, `App.jsx` | App rendered | Navigate to `/nonexistent-page` | 404 page renders with "Page Not Found" and "Return to Home" link | Tests `<Route path="*">` catch-all |
| **FE-IT-23** | 🖱️ | Cross-page Navigation Links | Login page "Create Account" link goes to `/signup`; Signup page "Sign In" link goes to `/login`; Login page "Forgot Password" goes to `/forgot-password` | `Signin.jsx`, `Signup.jsx`, `App.jsx` | App at respective pages | Click the cross-page links | Correct page renders after each navigation | Tests `<Link>` component navigation between auth pages |

---

## 5. Dashboard & Search

Tests verify the Home page functionality including user greeting, search, and navigation to patient records.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-24** | ✅ | Home → Greeting Display | Home page fetches and displays doctor's full name | `Home.jsx`, `authService.js` | Authenticated, API returns `{ fullName: "Jane Doe" }` | N/A | Heading shows "Dr. Jane Doe's Workspace" | Tests `getAccount()` → state → render |
| **FE-IT-25** | ✅ | Search → Results → Navigate to Patient | User types in search bar, results appear, clicks a result | `SearchBar.jsx`, `patientService.js` | Home page rendered, API returns patient results | Search query: "Jane" | Results dropdown shows patient names → Click "Jane Doe" → `<Navigate to="/patient/Jane%20Doe">` triggered | Tests debounced search → API → result click → navigation |
| **FE-IT-26** | 🧩 | Search → No Results | User searches for a non-existent patient name | `SearchBar.jsx`, `patientService.js` | Home page rendered, API returns empty array | Search query: "zzzznonexistent" | "No Registry Matches" message displayed with "Unable to locate records for..." | Tests empty result state rendering |
| **FE-IT-27** | 🧩 | Search → Debounce Behavior | Rapid typing should debounce and only call API after 300ms pause | `SearchBar.jsx`, `patientService.js` | Home page rendered | Rapid successive keystrokes | Only one API call made after the final keystroke + 300ms | Tests `setTimeout`/`clearTimeout` debounce logic |
| **FE-IT-28** | 🖱️ | Search → Snippet Highlighting | Search result shows highlighted matching text from patient fields | `SearchBar.jsx` | API returns patient with matching `clinicalDiagnosis` | Search query: "migraine" | Result shows "Match: ...migraine..." with the keyword highlighted/underlined | Tests `getSnippet()` + `highlightRegex` rendering |
| **FE-IT-29** | 🖱️ | Dashboard → Navigation Cards | Clicking "New Patient Entry" navigates to `/new-entry`; "Account Settings" to `/account` | `Home.jsx`, `App.jsx` | Authenticated, Home page rendered | Click each `<DashboardCard>` | Respective pages render correctly | Tests `<Link to>` inside `DashboardCard` component |
| **FE-IT-30** | ✅ | Dashboard → Logout | User clicks Logout card on Home page | `Home.jsx`, `auth.js` | Authenticated, Home page rendered | Click Logout button | `logout()` called → localStorage cleared → cookie cleared → success toast → navigated to `/` → page reloads | Tests `handleLogout` end-to-end flow |

---

## 6. Patient Form — Create Flow

Tests verify the NewEntry page + PatientForm + usePatientForm hook interaction during patient creation.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-31** | ✅ | New Entry → Fill Form → Save → Navigate | User fills minimum required fields (name, age, phone, examdate, comorbidity) and submits | `NewEntry.jsx`, `PatientForm.jsx`, `PatientFormSections.jsx`, `usePatientForm.js`, `patientService.js` | Authenticated, at `/new-entry` | `{ name: "Jane Doe", age: 45, phone: "9876543210", examdate: "2026-06-03T10:00" }`, comorbidity: "None" | Loading toast → Success toast "Patient record saved." → Navigated to `/patient/Jane Doe` | Tests the full create workflow across 4+ components |
| **FE-IT-32** | 🚫 | New Entry → Submit Disabled Without Required Fields | Submit button disabled until all required fields filled | `PatientForm.jsx`, `usePatientForm.js` | Authenticated, at `/new-entry`, form empty | Leave required fields empty | Submit button has `disabled` class, `cursor-not-allowed` styling | Tests `isFormValid` reactive computation |
| **FE-IT-33** | 🚫 | New Entry → Investigation Region Validation | User selects MRI investigation but doesn't add region, then submits | `PatientForm.jsx`, `usePatientForm.js`, `PatientFormDetails.jsx` | Form filled with required fields | Select "MRI" investigation, leave region empty, submit | Error toast "Please add at least one MRI region before submitting." | Tests `handleSubmit` validation in `usePatientForm` |
| **FE-IT-34** | 🚫 | New Entry → Partial BP Validation | User enters only systolic BP without diastolic | `PatientForm.jsx`, `PatientFormSections.jsx`, `usePatientForm.js` | Form filled with required fields | vitals.bp.systolic: 120, vitals.bp.diastolic: "" | Error toast "Please enter both the Systolic and Diastolic blood pressure values..." | Tests paired vitals validation |
| **FE-IT-35** | 🖱️ | New Entry → Medicine Section Toggle | User clicks "Medicines" toggle → adds medicine → fills fields → removes medicine | `PatientForm.jsx`, `PatientFormDetails.jsx (TreatmentPlan)`, `usePatientForm.js` | Authenticated, at `/new-entry` | Click "Medicines" → fill medicine fields → click remove | Medicine card appears → data entered → card removed, medicines array updated | Tests `showMedicines` toggle + `addMedicine`/`removeMedicine` + UI state sync |
| **FE-IT-36** | ✅ | New Entry → Full Clinical Form Submission | Fill ALL form sections including vitals, comorbidities with duration, allergies with details, medicines, investigations (MRI + CT with contrast), and notes | `NewEntry.jsx`, `PatientForm.jsx`, all form sub-components, `usePatientForm.js`, `patientService.js` | Authenticated, at `/new-entry` | Complete patient data across all sections | `createPatient` called with correctly structured `submissionData` (formatted treatments, clean vitals, investigation details), success toast, navigate to patient page | End-to-end integration of the entire form ecosystem |
| **FE-IT-37** | 💥 | New Entry → API Failure | Form submission succeeds client-side but `createPatient` API call fails | `NewEntry.jsx`, `patientService.js`, `apiClient.js` | Form filled and submitted | API returns 500 | Error toast "An error occurred while attempting to save the record.", user stays on form | Tests error handling propagation |
| **FE-IT-38** | 🖱️ | New Entry → Cancel Button | User clicks Cancel during form fill | `PatientForm.jsx` | Authenticated, at `/new-entry`, form partially filled | Click "Cancel" button | Navigated back to `/home` | Tests cancel → `navigate("/home")` |
| **FE-IT-67** | 🖱️ | Medicine → Fill All Fields | User opens Medicines section, fills name, dosage, dose unit dropdown, schedule buttons, days count, days unit dropdown, and instructions for a single medicine | `PatientForm.jsx`, `PatientFormDetails.jsx (TreatmentPlan, MedTypeDropdown)`, `usePatientForm.js` | Authenticated, at `/new-entry` | Click "Medicines" → type medicine name → set dose to 500 → change unit to "gm" → click "Morning" and "Night" schedule buttons → set days to 10 → change days unit to "Months" → type "Before food" in instructions | All fields reflect entered values. Medicine name input, dosage spinbutton, dose unit `<select>`, schedule buttons (Morning and Night active with `bg-blue-600`), days spinbutton, days unit `<select>`, and instructions input all render with correct data | Exercises `updateMedicine(idx, "name", ...)`, `updateMedicine(idx, "dose", ...)`, `updateMedicine(idx, "doseUnit", ...)`, `updateMedicine(idx, "schedule", ...)`, `updateMedicine(idx, "daysCount", ...)`, `updateMedicine(idx, "daysUnit", ...)`, `updateMedicine(idx, "instructions", ...)` — all inline `onChange` callbacks on lines 80-128 of `PatientFormDetails.jsx` |
| **FE-IT-68** | 🖱️ | Medicine → Type Dropdown Selection | User opens Medicines section, clicks the medicine type dropdown (MedTypeDropdown), selects "Syr" (Syrup) | `PatientFormDetails.jsx (MedTypeDropdown)`, `usePatientForm.js` | Authenticated, at `/new-entry`, Medicines section open with one medicine | Click type button showing "Tab" → dropdown opens → click "Syr - Syrup" | Dropdown closes, type button now shows "Syr", medicine's `type` field updated to "Syr" | Exercises the real `MedTypeDropdown` `onChange` callback integrated with `usePatientForm.updateMedicine(idx, "type", val)`, plus the `useEffect` click-outside listener and `setOpen` toggle |
| **FE-IT-69** | 🖱️ | Notes Toggle → Other Treatment Textarea | User clicks the "Notes" toggle button, types supplemental treatment text, then toggles it off | `PatientForm.jsx`, `PatientFormDetails.jsx (TreatmentPlan)`, `usePatientForm.js` | Authenticated, at `/new-entry` | Click "Notes" button → type "Physiotherapy recommended 3x/week" → click "Notes" again | Notes textarea appears when toggled on with the entered text. `formData.otherDetails` updated. Textarea disappears when toggled off. | Exercises `setShowOtherTreatment` toggle and the `otherDetails` textarea `onChange → handleInputChange` callback on line 138 of `PatientFormDetails.jsx` (currently uncovered line) |
| **FE-IT-70** | 🖱️ | Investigation → MRI Region Add via Enter Key | User selects MRI, types "Cervical Spine" in the region input, presses Enter | `PatientForm.jsx`, `PatientFormDetails.jsx (Investigations)`, `usePatientForm.js` | Authenticated, at `/new-entry` | Click "MRI" button → type "Cervical Spine" in region input → press Enter | Region input clears, MRI tag at bottom shows "MRI (Cervical Spine)" | Exercises the `onKeyDown` handler on line 180 that calls `addMriRegion()` via Enter key, plus the `setNewInvestigationInput` `onChange` callback on line 179 |
| **FE-IT-71** | 🖱️ | Investigation → CT Region + Contrast Add | User selects CT, types "Abdomen" as region, selects "With Contrast", clicks the + add button | `PatientForm.jsx`, `PatientFormDetails.jsx (Investigations)`, `usePatientForm.js` | Authenticated, at `/new-entry` | Click "CT" → type "Abdomen" → click "With Contrast" → click + button | CT tag shows "CT (Abdomen [With Contrast])", region input clears, contrast resets | Exercises `setNewInvestigationInput` for CT region (line 195) and contrast (line 202) `onChange`/`onClick` callbacks, plus `addCtRegion` |
| **FE-IT-72** | 🖱️ | Investigation → ENMG Region Add | User selects ENMG, types "Upper Limb" in the region input, clicks the + button | `PatientForm.jsx`, `PatientFormDetails.jsx (Investigations)`, `usePatientForm.js` | Authenticated, at `/new-entry` | Click "ENMG" → type "Upper Limb" → click + | ENMG tag shows "ENMG (Upper Limb)", input clears | Exercises `setNewInvestigationInput` for ENMG (line 222) and `addEnmgRegion` on line 225. Also exercises `onKeyDown` on line 223 if tested via Enter key variant |
| **FE-IT-73** | 🖱️ | Comorbidity → Custom "Others" Add + Remove | User selects "Others" comorbidity, enters custom condition "Thyroid Disorder" with duration "1-5 Years", clicks +, then removes it via ✕ | `PatientForm.jsx`, `PatientFormSections.jsx (MedicalHistory)`, `usePatientForm.js` | Authenticated, at `/new-entry` | Click "Others" chip → type "Thyroid Disorder" in condition name → select "1-5 Years" duration → click + → click ✕ on "Thyroid Disorder" row | "Other: Thyroid Disorder" appears in active selections with "1-5 Years" duration. After ✕ click, it's removed from the list | Exercises `setCustomComorbidity` name/duration `onChange` callbacks (lines 125, 130), `addCustomComorbidity` (line 135), and `removeCustomComorbidity` (line 161) — all in `PatientFormSections.jsx` |
| **FE-IT-74** | 🖱️ | Comorbidity → Duration Update on Standard Entry | User selects "Diabetes" comorbidity, then changes its duration using the dropdown | `PatientForm.jsx`, `PatientFormSections.jsx (MedicalHistory)`, `usePatientForm.js` | Authenticated, at `/new-entry` | Click "Diabetes" chip → select "5-10 Years" from duration dropdown next to "Diabetes" | "Diabetes" appears in active selections, duration dropdown reflects "5-10 Years" | Exercises `updateComorbidityDuration(item.name, e.target.value)` callback on line 155 of `PatientFormSections.jsx` |

---

## 7. Patient Profile — View, Edit, Delete

Tests verify the patient profile page workflows including viewing, editing, deleting, and version history.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-39** | ✅ | Patient Profile → Data Load & Display | Navigate to `/patient/:name`, patient data and doctor profile fetched and displayed | `PatientProfilePage.jsx (Patient)`, `patientService.js`, `authService.js` | Authenticated | API returns full patient data + doctor profile | Patient name, age, vitals, comorbidities, clinical findings, investigations, treatments all rendered correctly. Doctor header shows on print area | Tests `Promise.all([getPatient, getAccount])` → full render |
| **FE-IT-40** | 💥 | Patient Profile → Fetch Error | API returns error when fetching patient data | `PatientProfilePage.jsx (Patient)`, `patientService.js` | Authenticated, navigate to `/patient/Unknown` | API returns 404 | Error message displayed in the view, loading state clears | Tests error state rendering |
| **FE-IT-41** | ✅ | Patient Profile → Edit Navigation | User clicks "Edit" button, navigated to `/update/:name` with patient data in state | `PatientProfilePage.jsx (PatientView)` | Patient data loaded | Click "Edit" button | Navigated to `/update/${name}`, `location.state` contains patient data | Tests `navigate()` with state passing |
| **FE-IT-42** | ✅ | Patient Profile → Edit → Save → Redirect | User edits patient, saves, and is redirected back to profile | `PatientProfilePage.jsx (Update)`, `PatientForm.jsx`, `usePatientForm.js`, `patientService.js` | At `/update/:id` with patient data in `location.state` | Modify fields, click "Save Changes" | `updatePatient` called → success toast → navigated to `/patient/${newName}` | Tests edit mode: `hasChanges` tracking + submission |
| **FE-IT-43** | ✅ | Patient Profile → Delete Confirmation Flow | User clicks Delete → confirmation toast appears → confirms → patient deleted → redirected | `PatientProfilePage.jsx (Patient)`, `patientService.js` | Patient data loaded | Click "Delete" → Click "Delete Record" in confirmation toast | `deletePatient` called → success toast "Patient record successfully removed." → navigated to `/home` | Tests two-step delete: toast confirmation → API call → redirect |
| **FE-IT-44** | 🖱️ | Patient Profile → Delete Cancel | User clicks Delete → confirmation appears → clicks Cancel | `PatientProfilePage.jsx (Patient)` | Patient data loaded | Click "Delete" → Click "Cancel" in toast | Toast dismissed, patient data still displayed, no API call made | Tests confirmation dismissal |
| **FE-IT-45** | 🖱️ | Patient Profile → Version History Modal | User clicks "Versions" → modal opens → selects a version → version data displayed → clicks "Back to List" | `PatientProfilePage.jsx (Patient + PatientView)` | Patient data loaded with `versions` array | Click "Versions" → Click a version entry | Version history modal opens → version list shows → click entry → `PatientView` renders historic data with `isVersionView=true` → "Back to List" returns to list | Tests modal state management + version selection |
| **FE-IT-46** | 🧩 | Patient Profile → No Versions | Patient has no version history | `PatientProfilePage.jsx` | Patient data loaded with empty `versions: []` | Click "Versions" | Modal shows "No previous versions available." | Edge case: empty versions array |

---

## 8. Patient Profile — Print Workflow

Tests verify the print gating logic that requires a complete doctor profile.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-47** | 🔒 | Print → Blocked by Incomplete Profile | Doctor profile is missing department, KMC number | `PatientProfilePage.jsx (Patient)`, `authService.js` | Patient loaded, doctor profile missing `department` and `kmcNumber` | Click "Print" | Error toast listing missing fields ("Department", "KMC Number") with "Go to Profile" button | Tests `handlePrint` field validation + navigable toast |
| **FE-IT-48** | 🖱️ | Print → "Go to Profile" Link in Toast | User clicks "Go to Profile" in the print error toast | `PatientProfilePage.jsx` | Print blocked toast visible | Click "Go to Profile" button in toast | Toast dismissed, navigated to `/account` | Tests toast interaction → navigation |
| **FE-IT-49** | ✅ | Print → Allowed with Complete Profile | Doctor profile has all required fields (department, position, qualifications, kmcNumber) | `PatientProfilePage.jsx (Patient)` | Patient loaded, complete doctor profile | Click "Print" | `window.print()` called, print styles injected and cleaned up | Tests successful print flow |

---

## 9. Profile Page — View & Edit

Tests verify the user profile page workflows including viewing, editing, and account management.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-50** | ✅ | Profile → Load & Display | Navigate to `/account`, profile data fetched and all fields displayed in view mode | `ProfilePage.jsx`, `authService.js` | Authenticated, `localStorage.isLoggedIn` set | N/A | All `ProfileItem` components render with correct data (fullName, username, email, department, etc.) | Tests `getAccount()` → multi-field state initialization |
| **FE-IT-51** | ✅ | Profile → Edit → Save | User clicks "Edit Profile" → modifies fields → clicks "Save Changes" | `ProfilePage.jsx`, `authService.js` | Profile loaded in view mode | Edit fullName: "Dr. Jane Updated", department: "Neurosurgery" | `updateAccount` called with merged data → success toast → view mode restored with updated data | Tests `isEditing` toggle + `handleSave` + state merge |
| **FE-IT-52** | 💥 | Profile → Edit → Save Failure | Profile update API call fails | `ProfilePage.jsx`, `authService.js` | Profile in edit mode, fields modified | API returns 500 | Error toast "Failed to update profile details.", stays in edit mode | Tests error handling keeps edit state intact |
| **FE-IT-53** | 🖱️ | Profile → Edit → Cancel | User starts editing, then clicks Cancel | `ProfilePage.jsx` | Profile in edit mode | Click "Cancel" | Returns to view mode with original (unsaved) data | Tests `isEditing=false` revert |
| **FE-IT-54** | 🖱️ | Profile → Add/Remove Qualifications | User clicks "+ Add Qualification", fills it, then removes it | `ProfilePage.jsx` | Profile in edit mode | Add: "DM Neurology"; Remove via "-" button | Qualification field appears → filled → removed from array → UI updates | Tests dynamic array manipulation in edit mode |
| **FE-IT-55** | 💥 | Profile → Load Failure → Redirect | Profile API call fails on load | `ProfilePage.jsx`, `authService.js` | Authenticated, `localStorage.isLoggedIn` set, API returns 500 | N/A | Error toast "Could not load your profile.", redirected to `/login` | Tests error-driven navigation |

---

## 10. Profile Page — Account Actions

Tests verify account deactivation and deletion workflows with two-step confirmation.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-56** | ✅ | Delete Account → Confirm → Success | User clicks Delete Account → confirms → account deleted → logout | `ProfilePage.jsx`, `authService.js` | Profile loaded in view mode | Click "Delete Account" → Click "Confirm Delete" in toast | `deleteAccount()` called → success toast "Account deleted." → localStorage cleared → cookie cleared → navigated to `/` → reload | Tests full destructive action workflow |
| **FE-IT-57** | 🖱️ | Delete Account → Cancel | User clicks Delete Account → cancels in confirmation toast | `ProfilePage.jsx` | Profile loaded | Click "Delete Account" → Click "Cancel" | Toast dismissed, profile still visible, no API call | Tests confirmation dismissal |
| **FE-IT-58** | 💥 | Delete Account → API Failure | Deletion API call fails | `ProfilePage.jsx`, `authService.js` | Profile loaded, confirmation accepted | API returns 500 | Error toast with server message, profile remains | Tests error handling on destructive action |

---

## 11. Global API Client — Interceptor Behavior

Tests verify the `apiClient` response interceptor handles session expiry, forbidden access, and server errors correctly across the app.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-59** | 🔒 | 401 Response → Session Expiry | Any API call returns 401 while user is on a non-login page (e.g., `/home`) | `apiClient.js`, `Home.jsx` | User on `/home` or `/account` | API returns 401 | `localStorage.isLoggedIn` removed, session expiry toast shown, `window.location.href` set to `/login` | Tests global interceptor session handling |
| **FE-IT-60** | 🧩 | 401 on Login Page → No Redirect | API returns 401 while user is on `/login` page | `apiClient.js`, `Signin.jsx` | User on `/login` | Login API returns 401 | No redirect triggered (interceptor skips for `/login` and `/`), error handled by component | Tests the `window.location.pathname !== '/login'` guard |
| **FE-IT-61** | 🔒 | 403 Response → Forbidden Toast | API returns 403 for any request | `apiClient.js` | User on any page | API returns 403 | Toast: "You do not have the required permissions..." | Tests 403 interceptor toast |
| **FE-IT-62** | 💥 | 500+ Response → Server Error Toast | API returns 500 | `apiClient.js` | User on any page | API returns 500 | Toast: "The clinical system is currently experiencing issues..." | Tests server error interceptor |

---

## 12. App-Level Initialization

Tests verify the App component's startup behavior including auth check and backend ping.

| Test Case ID | Legend | Function | Test Scenario / Description | File(s) | Preconditions | Input Data | Expected Result | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FE-IT-63** | ✅ | App Init → Auth Check → Fetch Username | On mount, App checks auth status and fetches username if authenticated | `App.jsx`, `auth.js`, `authService.js` | `isAuthenticated()` returns true | N/A | `authenticated` state set to true, `user` state set to username from `getAccount()`, Navbar receives username prop | Tests `useEffect` → `checkAuth` → `fetchUsername` chain |
| **FE-IT-64** | 🧩 | App Init → Unauthenticated | On mount, auth check returns false | `App.jsx`, `auth.js` | `isAuthenticated()` returns false | N/A | `authenticated` state remains false, protected routes redirect to login | Tests unauthenticated init state |
| **FE-IT-65** | ✅ | App → Logout Flow | User clicks Navbar logout → full logout sequence | `App.jsx`, `Navbar.jsx`, `auth.js` | Authenticated, on a page where Navbar is visible (e.g., `/account`) | Click Navbar "Logout" button | `logout()` called → `authenticated` set false → `user` set null → localStorage cleared → cookie cleared → success toast | Tests `handleLogout` → state reset → UI update chain |
| **FE-IT-66** | 💥 | App → Logout Failure | Logout API call fails | `App.jsx`, `auth.js` | Authenticated | `logout()` returns false | Error toast "Logout process encountered an error.", user remains authenticated | Tests failed logout error toast |
