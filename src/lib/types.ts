export interface ProspectData {
  id?: string;
  tanggalRekap: string;
  namaSales: string;
  namaCust: string;
  noHP: string;
  alamat: string;
  penghasilanEstimasi: string;
  produkDiminati: string;
  urgensi: string;
  status: 'Hot' | 'Warm' | 'Cold';
  skorPrioritas: number;
  catatanAI: string;
  namaFile: string;
  masalahCustomer: string;
  catatanSales: string;
}

export interface ExtractResponse {
  success: boolean;
  data?: ProspectData;
  error?: string;
}

export interface SheetsResponse {
  success: boolean;
  data?: ProspectData[];
  error?: string;
}

export type UserRole = 'admin' | 'sales';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  nama: string;
  role: UserRole;
}
