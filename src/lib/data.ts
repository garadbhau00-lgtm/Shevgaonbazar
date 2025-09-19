import type { Ad, User } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const mockUsers: User[] = [
    { id: 'user1', name: 'राम पाटील', village: 'शेवगाव', phone: '9876543210', role: 'Farmer' },
    { id: 'user2', name: 'सीता देशमुख', village: 'बोधेगाव', phone: '9876543211', role: 'Farmer' },
];

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export const mockAds: Ad[] = [
  {
    id: 'ad1',
    title: 'निरोगी काळी शेळी',
    description: 'विक्रीसाठी उपलब्ध असलेली एक वर्षाची निरोगी काळी शेळी. सर्व लसीकरण पूर्ण.',
    category: 'पशुधन',
    price: 8500,
    location: 'शेवगाव',
    photos: [getImage('ad1')],
    status: 'approved',
    userId: 'user1',
  },
  {
    id: 'ad2',
    title: 'ताजा गावराण कांदा',
    description: 'शेतातून ताजा काढलेला गावराण कांदा. 10 क्विंटल उपलब्ध.',
    category: 'शेती उत्पादन',
    price: 2500,
    location: 'बोधेगाव',
    photos: [getImage('ad2')],
    status: 'approved',
    userId: 'user2',
  },
  {
    id: 'ad3',
    title: 'वापरलेले ट्रॅक्टर',
    description: 'महिंद्रा ट्रॅक्टर, मॉडेल 2018, उत्तम स्थितीत आहे.',
    category: 'उपकरणे',
    price: 350000,
    location: 'शेवगाव',
    photos: [getImage('ad3')],
    status: 'pending',
    userId: 'user1',
  },
  {
    id: 'ad4',
    title: 'गीर गाय विक्रीसाठी',
    description: 'दुसरी वेत, दिवसाला 12 लिटर दूध देणारी गीर गाय.',
    category: 'पशुधन',
    price: 75000,
    location: 'लाडजळगाव',
    photos: [getImage('ad4')],
    status: 'approved',
    userId: 'user2',
  },
   {
    id: 'ad5',
    title: 'सेंद्रिय टोमॅटो',
    description: 'पूर्णपणे सेंद्रिय पद्धतीने पिकवलेले ताजे टोमॅटो. दररोज 50 किलो उपलब्ध.',
    category: 'शेती उत्पादन',
    price: 40,
    location: 'चापडगाव',
    photos: [getImage('ad5')],
    status: 'rejected',
    userId: 'user1',
  },
  {
    id: 'ad6',
    title: 'नवीन नांगर',
    description: 'शेतीसाठी नवीन, मजबूत आणि टिकाऊ नांगर.',
    category: 'उपकरणे',
    price: 15000,
    location: 'अमरापूर',
    photos: [getImage('ad6')],
    status: 'approved',
    userId: 'user2',
  },
];
