# IDEONIX Firestore Security Specification

## 1. Data Invariants
1. Every document in `/users/{userId}` belongs strictly to `request.auth.uid == userId` and isolates PII (`email`) from other users.
2. Every document in `libraryItems`, `campaigns`, `calendarEntries`, and `activityLogs` must carry `userId == request.auth.uid` on creation and never allow `userId` or `createdAt` to be reassigned on update.
3. All document IDs must pass `^[a-zA-Z0-9_-]+$` and length `<= 128`.
4. All server timestamps (`createdAt`, `updatedAt`) must match `request.time`.
5. Terminal statuses (`Campaign.status == 'Completed'`, `CalendarEntry.status == 'Published'`) lock subsequent mutations.
6. All writes require `request.auth.token.email_verified == true`.

## 2. Adversarial "Dirty Dozen" Payloads
1. Unauthenticated read/write to `/users/uid1` -> `PERMISSION_DENIED`
2. Cross-user read (`get`) on `/users/otherUid` -> `PERMISSION_DENIED`
3. Cross-user `list` query on `libraryItems` without `where('userId', '==', uid)` -> `PERMISSION_DENIED`
4. Forged `userId` on `libraryItems` create (`userId: 'victim'`) -> `PERMISSION_DENIED`
5. Shadow field injection (`{ ..., isAdmin: true }`) on `users` or `libraryItems` -> `PERMISSION_DENIED`
6. Oversized document ID (`> 128` chars or invalid chars) -> `PERMISSION_DENIED`
7. Client-forged `createdAt` timestamp (`!= request.time`) -> `PERMISSION_DENIED`
8. Mutating `userId` or `createdAt` during `update` -> `PERMISSION_DENIED`
9. Updating a `Completed` campaign or `Published` calendar entry -> `PERMISSION_DENIED`
10. Unverified email user attempting write -> `PERMISSION_DENIED`
11. Unbounded `tags` array (`size > 10` or non-string first element) -> `PERMISSION_DENIED`
12. Attempting to update an immutable `activityLogs` document -> `PERMISSION_DENIED`
