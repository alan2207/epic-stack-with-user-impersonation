# Epic Stack with User Impersonation

User impersonation is a feature that allows admin users to log in as any other
user without knowing their password. This is useful for troubleshooting issues
that a user may be experiencing.

This demonstrates how to implement this feature in an Epic Stack application.

![Demo](./demo.gif)

## How it works

When an admin user wants to impersonate another user, we need to:

- Get current session ID from the cookie and store it in the session as
  `impersonatorSessionId`
- Create a new session for the user we want to impersonate and store it in the
  cookie as `sessionId`

When the user stops impersonating, we need to:

- Take the session ID stored in `impersonatorSessionId` and assign it to
  `sessionId`, which will restore the original admin session.
- Clear `impersonatorSessionId` from the cookie
