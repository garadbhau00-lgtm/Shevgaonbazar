export type Ad = {
  id: string;
  title: string;
  description: string;
  category: 'पशुधन' | 'शेती उत्पादन' | 'उपकरणे';
  price: number;
  location: string; // village
  mobileNumber: string;
  photos: string[]; // image urls
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
  createdAt: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  rejectionReason?: string;
};

export type UserProfile = {
    uid: string;
    email: string;
    name?: string;
    role: 'Farmer' | 'Admin';
    disabled: boolean;
    createdAt: any; // Firestore timestamp
};

export type User = {
    id: string;
    name: string;
    village: string;
    phone: string;
    role: 'Farmer' | 'Admin';
};
