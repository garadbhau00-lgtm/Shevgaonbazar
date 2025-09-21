
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
  subcategories: string[];
  icon: ComponentType<{ className?: string }>;
};

export const categories: Category[] = [
  {
    name: 'पशुधन',
    subcategories: ['गाय', 'बैल', 'म्हैस', 'शेळी', 'मेंढी', 'कुक्कुटपालन'],
    icon: PawPrint,
  },
  {
    name: 'शेती उत्पादने',
    subcategories: ['कांदा', 'कापूस', 'धान्य', 'भाजीपाला', 'फळे'],
    icon: Leaf,
  },
  {
    name: 'शेतीसाठी साधनं',
    subcategories: ['ट्रॅक्टर', 'अवजारं', 'सिंचन साहित्य', 'हार्वेस्टर'],
    icon: Tractor,
  },
  {
    name: 'शेती व गाव सेवा',
    subcategories: ['वाहतूक', 'ड्रोन स्प्रे', 'कंत्राटी शेती', 'पशुवैद्यक'],
    icon: ConciergeBell,
  },
  {
    name: 'गावातील गरज',
    subcategories: ['बांधकाम साहित्य', 'सेकंड हँड वाहनं', 'खाद्यपदार्थ'],
    icon: Building2,
  },
  {
    name: 'व्यावसायिक सेवा',
    subcategories: [
      'प्लंबर',
      'इलेक्ट्रिशियन',
      'सुतार',
      'मिस्त्री',
      'मेकॅनिक',
      'DJ/टेंट',
      'टॅक्सी',
    ],
    icon: Wrench,
  },
  {
    name: 'आर्थिक',
    subcategories: ['उधारी/इनव्हॉईस', 'बचत संस्था', 'सरकारी योजना'],
    icon: Landmark,
  },
];
