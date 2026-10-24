export type UserRole =
  | 'prowner'
  | 'prunner';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
};

export type DemoSession = {
  user: User;
  createdAt: string;
};
