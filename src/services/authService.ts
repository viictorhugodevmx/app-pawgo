import type {
  DemoSession,
  User,
} from '../types/auth';

const DEMO_USERS: User[] = [
  {
    id: 'user-prowner-001',
    name: 'Víctor',
    email: 'owner@pawgo.demo',
    role: 'prowner',
  },
  {
    id: 'user-prunner-001',
    name: 'Diego',
    email: 'walker@pawgo.demo',
    role: 'prunner',
  },
];

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function loginDemo(
  email: string,
): Promise<DemoSession> {
  await wait(350);

  const normalizedEmail =
    email.trim().toLowerCase();

  const user = DEMO_USERS.find(
    (candidate) =>
      candidate.email ===
      normalizedEmail,
  );

  if (!user) {
    throw new Error(
      'Demo user not found.',
    );
  }

  return {
    user: {
      ...user,
    },
    createdAt:
      new Date().toISOString(),
  };
}

export function getDemoUsers(): User[] {
  return DEMO_USERS.map(
    (user) => ({ ...user }),
  );
}
