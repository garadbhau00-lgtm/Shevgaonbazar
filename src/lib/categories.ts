
import { ComponentType } from 'react';
import {
  PawPrint,
  Leaf,
  Tractor,
  ConciergeBell,
  Building2,
  Wrench,
  Landmark,
  List,
} from 'lucide-react';

export type Category = {
  name:
    | 'पशुधन'
    | 'शेती उत्पादने'
    | 'शेतीसाठी साधनं'
    | 'शेती व गाव सेवा'
    | 'गावातील गरज'
    | 'व्यावसायिक सेवा'
    | 'आर्थिक';
  subcategories: { key: string, name: string }[];
  icon: ComponentType<{ className?: string }>;
};

export const categories: Category[] = [
  {
    name: 'पशुधन',
    subcategories: [
        { key: 'cow', name: 'गाय' },
        { key: 'bull', name: 'बैल' },
        { key: 'buffalo', name: 'म्हैस' },
        { key: 'goat', name: 'शेळी' },
        { key: 'sheep', name: 'मेंढी' },
        { key: 'poultry', name: 'कुक्कुटपालन' }
    ],
    icon: PawPrint,
  },
  {
    name: 'शेती उत्पादने',
    subcategories: [
        { key: 'onion', name: 'कांदा' },
        { key: 'cotton', name: 'कापूस' },
        { key: 'grains', name: 'धान्य' },
        { key: 'vegetables', name: 'भाजीपाला' },
        { key: 'fruits', name: 'फळे' }
    ],
    icon: Leaf,
  },
  {
    name: 'शेतीसाठी साधनं',
    subcategories: [
        { key: 'tractor', name: 'ट्रॅक्टर' },
        { key: 'tools', name: 'अवजारं' },
        { key: 'irrigation', name: 'सिंचन साहित्य' },
        { key: 'harvester', name: 'हार्वेस्टर' }
    ],
    icon: Tractor,
  },
  {
    name: 'शेती व गाव सेवा',
    subcategories: [
        { key: 'transport', name: 'वाहतूक' },
        { key: 'drone_spray', name: 'ड्रोन स्प्रे' },
        { key: 'contract_farming', name: 'कंत्राटी शेती' },
        { key: 'veterinary', name: 'पशुवैद्यक' }
    ],
    icon: ConciergeBell,
  },
  {
    name: 'गावातील गरज',
    subcategories: [
        { key: 'construction_material', name: 'बांधकाम साहित्य' },
        { key: 'second_hand_vehicle', name: 'सेकंड हँड वाहनं' },
        { key: 'food_items', name: 'खाद्यपदार्थ' }
    ],
    icon: Building2,
  },
  {
    name: 'व्यावसायिक सेवा',
    subcategories: [
      { key: 'plumber', name: 'प्लंबर' },
      { key: 'electrician', name: 'इलेक्ट्रिशियन' },
      { key: 'carpenter', name: 'सुतार' },
      { key: 'mason', name: 'मिस्त्री' },
      { key: 'mechanic', name: 'मेकॅनिक' },
      { key: 'dj_tent', name: 'DJ/टेंट' },
      { key: 'taxi', name: 'टॅक्सी' },
    ],
    icon: Wrench,
  },
  {
    name: 'आर्थिक',
    subcategories: [
        { key: 'credit_invoice', name: 'उधारी/इनव्हॉईस' },
        { key: 'savings_group', name: 'बचत संस्था' },
        { key: 'government_schemes', name: 'सरकारी योजना' }
    ],
    icon: Landmark,
  },
];
