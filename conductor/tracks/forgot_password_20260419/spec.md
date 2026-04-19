# Specification: Add forgot password and password reset functionality

## 1. Overview
Implement a secure "forgot password" flow allowing users to reset their passwords via an emailed reset token.

## 2. Requirements
- **Forgot Password Endpoint:** An endpoint to request a reset token by providing an email address.
- **Token Generation:** Secure, short-lived token generation for password resets.
- **Email Dispatch:** Background job integration (via BullMQ) to send the reset token/link to the user.
- **Reset Password Endpoint:** An endpoint that accepts the token and a new password to update the user's credentials.
- **Security:** Tokens must be one-time use and expire (e.g., in 15 minutes). Rate limiting must be applied to prevent abuse.

## 3. Architecture & Tech Stack Context
- **Controllers:** Add endpoints to the Auth module (`src/api/auth`).
- **Services:** Implement token generation and validation in `AuthService` or a dedicated `PasswordResetService`.
- **Database:** Create a new table or modify the `users` schema to store reset tokens and their expiration, or use Redis for ephemeral storage.
- **Jobs:** Utilize the existing BullMQ setup (`src/jobs`) to queue and process password reset emails.