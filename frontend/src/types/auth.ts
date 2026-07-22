export type UserRole =
  | 'CEO'
  | 'Accountant'
  | 'ProjectManager'
  | 'Employee'
  | 'Admin'

export interface AppUser {
  userId: string
  email: string
  role: UserRole
}
