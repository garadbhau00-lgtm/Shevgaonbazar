

export type Ad = {
  id: string;
  title?: string;
  description?: string;
  category:
    | 'पशुधन'
    | 'शेती उत्पादने'
    | 'शेतीसाठी साधनं'
    | 'शेती व गाव सेवा'
    | 'गावातील गरज'
    | 'व्यावसायिक सेवा'
    | 'आर्थिक';
  subcategory?: string;
  price: number;
  location: string; // village
  mobileNumber: string;
  photos: string[]; // image urls
  status: 'pending' | 'approved' | 'rejected';
  userId: string;
  userName: string; // Seller's name
  createdAt: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  rejectionReason?: string;
};

// This type represents the data that is ready for Firestore submission.
export type AdSubmission = Omit<Ad, 'id'>;

export type UserProfile = {
    uid: string;
    email: string;
    name?: string;
    mobileNumber?: string;
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

export type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  timestamp: any; // Firestore Timestamp
};

export type Conversation = {
  id: string;
  participants: string[]; // array of user UIDs
  participantProfiles: {
    [uid: string]: {
      name: string;
      photoURL?: string;
    }
  },
  adId: string;
  adPhoto: string;
  adTitle: string;
  lastMessage?: string;
  lastMessageSenderId?: string;
  lastMessageTimestamp?: any; // Firestore Timestamp
  unreadBy: {
    [uid: string]: boolean;
  }
};

    