export interface InitialAdminRepository {
  findByEmail(email: string): Promise<boolean>;
  createInitialGeneralAdmin(input: InitialGeneralAdmin): Promise<void>;
}

export interface InitialGeneralAdmin {
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'ADMIN_GENERAL';
  branchId: null;
  isActive: boolean;
}

export async function ensureInitialAdmin(
  repository: InitialAdminRepository,
  input: Pick<InitialGeneralAdmin, 'email' | 'passwordHash'>,
): Promise<'created' | 'existing'> {
  if (await repository.findByEmail(input.email)) {
    return 'existing';
  }

  await repository.createInitialGeneralAdmin({
    email: input.email,
    passwordHash: input.passwordHash,
    fullName: 'Administrador General',
    role: 'ADMIN_GENERAL',
    branchId: null,
    isActive: true,
  });

  return 'created';
}
