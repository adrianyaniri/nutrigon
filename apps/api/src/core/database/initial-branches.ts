import type { CreateBranchDto } from '@nutrigon/contracts';

export type InitialBranch = CreateBranchDto;

export const initialBranches: readonly InitialBranch[] = [
  {
    name: 'Nutrigon Vergara',
    slug: 'vergara',
    address: 'Av. Vergara 2395, Villa Tesei, Hurlingham',
  },
  {
    name: 'Nutrigon Villegas',
    slug: 'villegas',
    address: 'Gral. Conrado Villegas 1971, William Morris, Hurlingham',
  },
  {
    name: 'Nutrigon Origone',
    slug: 'origone',
    address: 'Tte. Manuel Origone 18, Villa Tesei, Hurlingham',
  },
];
