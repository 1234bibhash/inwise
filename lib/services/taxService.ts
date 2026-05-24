export interface TaxClassification {
  category: string;
  subcategories: {
    name: string;
    variants: {
      label: string;
      tax_rate: number;
      hsn_code: string;
    }[];
  }[];
}

export const CLASSIFICATIONS: TaxClassification[] = [
  {
    category: 'Electronics',
    subcategories: [
      {
        name: 'Televisions',
        variants: [
          { label: 'Below 43 Inches', tax_rate: 18, hsn_code: '85287211' },
          { label: '43 Inches', tax_rate: 18, hsn_code: '85287211' },
          { label: 'Above 43 Inches', tax_rate: 18, hsn_code: '85287219' },
        ]
      },
      {
        name: 'Smartphones',
        variants: [
          { label: 'Mobile Phones', tax_rate: 18, hsn_code: '85171290' },
          { label: 'Feature Phones', tax_rate: 18, hsn_code: '85171210' }
        ]
      },
      {
        name: 'Cameras',
        variants: [
          { label: 'DSLR', tax_rate: 18, hsn_code: '85258020' },
          { label: 'Mirrorless', tax_rate: 18, hsn_code: '85258020' },
          { label: 'Action Camera', tax_rate: 18, hsn_code: '85258090' },
          { label: 'CCTV', tax_rate: 18, hsn_code: '85258010' }
        ]
      }
    ]
  },
  {
    category: 'Home Appliances',
    subcategories: [
      {
        name: 'Refrigerators',
        variants: [
          { label: 'Single Door', tax_rate: 18, hsn_code: '84182100' },
          { label: 'Double Door', tax_rate: 18, hsn_code: '84182100' },
          { label: 'Side-by-Side', tax_rate: 18, hsn_code: '84182100' },
        ]
      },
      {
        name: 'Washing Machines',
        variants: [
          { label: 'Semi-Automatic', tax_rate: 18, hsn_code: '84501200' },
          { label: 'Fully-Automatic', tax_rate: 18, hsn_code: '84501100' },
          { label: 'Front Load', tax_rate: 18, hsn_code: '84501100' },
        ]
      },
      {
        name: 'Air Conditioners',
        variants: [
          { label: 'Split AC', tax_rate: 18, hsn_code: '84151010' },
          { label: 'Window AC', tax_rate: 18, hsn_code: '84151090' },
          { label: 'Inverter AC', tax_rate: 18, hsn_code: '84151010' },
          { label: '1.0 Ton Split AC', tax_rate: 18, hsn_code: '84151010' },
          { label: '1.5 Ton Split AC', tax_rate: 18, hsn_code: '84151010' },
          { label: '1.6 Ton Split AC', tax_rate: 18, hsn_code: '84151010' },
          { label: '1.8 Ton Split AC', tax_rate: 18, hsn_code: '84151010' },
          { label: '1.9 Ton Split AC', tax_rate: 18, hsn_code: '84151010' },
          { label: '2.0 Ton Split AC', tax_rate: 18, hsn_code: '84151010' },
          { label: '2.1 Ton Split AC', tax_rate: 18, hsn_code: '84151010' },
          { label: '1.0 Ton Window AC', tax_rate: 18, hsn_code: '84151090' },
          { label: '1.5 Ton Window AC', tax_rate: 18, hsn_code: '84151090' },
          { label: '2.0 Ton Window AC', tax_rate: 18, hsn_code: '84151090' },
          { label: 'Inverter Split AC', tax_rate: 18, hsn_code: '84151010' },
          { label: 'Cassette AC', tax_rate: 18, hsn_code: '84151010' },
          { label: 'Tower AC', tax_rate: 18, hsn_code: '84151010' }
        ]
      },
      {
        name: 'Microwaves',
        variants: [
          { label: 'Solo', tax_rate: 18, hsn_code: '85165000' },
          { label: 'Convection', tax_rate: 18, hsn_code: '85165000' },
          { label: 'Grill', tax_rate: 18, hsn_code: '85165000' },
        ]
      },
      {
        name: 'Small Appliances',
        variants: [
          { label: 'Mixer Grinder', tax_rate: 18, hsn_code: '85094010' },
          { label: 'Water Purifier', tax_rate: 18, hsn_code: '84212110' },
          { label: 'Vacuum Cleaner', tax_rate: 18, hsn_code: '85081100' },
          { label: 'Iron', tax_rate: 18, hsn_code: '85164000' },
          { label: 'Fans', tax_rate: 18, hsn_code: '84145190' },
          { label: 'Geyser', tax_rate: 18, hsn_code: '85161000' }
        ]
      },
      {
        name: 'Kitchen Appliances',
        variants: [
          { label: 'Kettle', tax_rate: 18, hsn_code: '85161000' },
          { label: 'OTG / Oven', tax_rate: 18, hsn_code: '85165000' },
          { label: 'Induction Cooktop', tax_rate: 18, hsn_code: '85166000' },
          { label: 'Toaster', tax_rate: 18, hsn_code: '85167200' },
          { label: 'Air Fryer', tax_rate: 18, hsn_code: '85166000' },
          { label: 'Coffee Maker', tax_rate: 18, hsn_code: '85167100' }
        ]
      }
    ]
  },
  {
    category: 'Computers',
    subcategories: [
      {
        name: 'Laptops',
        variants: [
          { label: 'Standard', tax_rate: 18, hsn_code: '84713010' },
          { label: 'Gaming', tax_rate: 18, hsn_code: '84713010' },
          { label: 'Ultrabook', tax_rate: 18, hsn_code: '84713010' },
        ]
      },
      {
        name: 'Desktops',
        variants: [
          { label: 'All-in-One', tax_rate: 18, hsn_code: '84714190' },
          { label: 'Tower', tax_rate: 18, hsn_code: '84714190' },
          { label: 'Mini PC', tax_rate: 18, hsn_code: '84714190' },
        ]
      },
      {
        name: 'Monitors',
        variants: [
          { label: 'Below 32 Inches', tax_rate: 18, hsn_code: '85285200' },
          { label: 'Above 32 Inches', tax_rate: 18, hsn_code: '85285200' },
          { label: 'Curved', tax_rate: 18, hsn_code: '85285200' },
        ]
      },
      {
        name: 'Printers',
        variants: [
          { label: 'Inkjet', tax_rate: 18, hsn_code: '84433240' },
          { label: 'Laser', tax_rate: 18, hsn_code: '84433250' },
          { label: 'Thermal', tax_rate: 18, hsn_code: '84433290' },
        ]
      },
      {
        name: 'Components',
        variants: [
          { label: 'Motherboard', tax_rate: 18, hsn_code: '84733020' },
          { label: 'Processor', tax_rate: 18, hsn_code: '85423100' },
          { label: 'RAM', tax_rate: 18, hsn_code: '84733030' },
          { label: 'Graphic Card', tax_rate: 18, hsn_code: '84733099' },
          { label: 'Hard Drive/SSD', tax_rate: 18, hsn_code: '85235100' }
        ]
      }
    ]
  },
  {
    category: 'Audio',
    subcategories: [
      {
        name: 'Speakers',
        variants: [
          { label: 'Bluetooth', tax_rate: 18, hsn_code: '85182100' },
          { label: 'Home Theater', tax_rate: 18, hsn_code: '85182200' },
          { label: 'Soundbar', tax_rate: 18, hsn_code: '85182200' }
        ]
      },
      {
        name: 'Headphones',
        variants: [
          { label: 'Wired', tax_rate: 18, hsn_code: '85183000' },
          { label: 'Wireless', tax_rate: 18, hsn_code: '85183000' },
          { label: 'TWS Earbuds', tax_rate: 18, hsn_code: '85183000' }
        ]
      }
    ]
  },
  {
    category: 'Wearables',
    subcategories: [
      {
        name: 'Smartwatches',
        variants: [
          { label: 'Standard', tax_rate: 18, hsn_code: '85176290' },
          { label: 'LTE Enabled', tax_rate: 18, hsn_code: '85176290' }
        ]
      },
      {
        name: 'Fitness Bands',
        variants: [
          { label: 'Standard', tax_rate: 18, hsn_code: '85176290' }
        ]
      }
    ]
  },
  {
    category: 'Networking',
    subcategories: [
      {
        name: 'Routers',
        variants: [
          { label: 'Standard Wi-Fi', tax_rate: 18, hsn_code: '85176290' },
          { label: 'Mesh System', tax_rate: 18, hsn_code: '85176290' },
          { label: '4G/5G Router', tax_rate: 18, hsn_code: '85176290' }
        ]
      },
      {
        name: 'Switches',
        variants: [
          { label: 'Unmanaged', tax_rate: 18, hsn_code: '85176290' },
          { label: 'Managed', tax_rate: 18, hsn_code: '85176290' }
        ]
      }
    ]
  },
  {
    category: 'Software & Services',
    subcategories: [
      {
        name: 'Operating System',
        variants: [
          { label: 'Windows', tax_rate: 18, hsn_code: '85238020' },
          { label: 'Server OS', tax_rate: 18, hsn_code: '85238020' }
        ]
      },
      {
        name: 'Antivirus',
        variants: [
          { label: '1 Year License', tax_rate: 18, hsn_code: '85238020' },
          { label: '3 Year License', tax_rate: 18, hsn_code: '85238020' }
        ]
      },
      {
        name: 'Services',
        variants: [
          { label: 'Installation', tax_rate: 18, hsn_code: '998711' },
          { label: 'Repair', tax_rate: 18, hsn_code: '998711' },
          { label: 'Extended Warranty', tax_rate: 18, hsn_code: '998711' }
        ]
      }
    ]
  },
  {
    category: 'Accessories',
    subcategories: [
      {
        name: 'Cables',
        variants: [
          { label: 'USB', tax_rate: 18, hsn_code: '85444299' },
          { label: 'HDMI', tax_rate: 18, hsn_code: '85444299' },
          { label: 'Power', tax_rate: 18, hsn_code: '85444299' }
        ]
      },
      {
        name: 'Power Banks',
        variants: [
          { label: 'Below 10000mAh', tax_rate: 18, hsn_code: '85076000' },
          { label: 'Above 10000mAh', tax_rate: 18, hsn_code: '85076000' }
        ]
      },
      {
        name: 'Batteries',
        variants: [
          { label: 'AA/AAA', tax_rate: 18, hsn_code: '85061000' },
          { label: 'Inverter Battery', tax_rate: 18, hsn_code: '85072000' }
        ]
      }
    ]
  }
];

export function getTaxRate(category: string, subcategory: string, variant?: string): { gst_rate: number, hsn_code: string } {
  const cat = CLASSIFICATIONS.find(c => c.category === category);
  if (!cat) return { gst_rate: 18, hsn_code: '0000' };

  const sub = cat.subcategories.find(s => s.name === subcategory);
  if (!sub) return { gst_rate: 18, hsn_code: '0000' };

  if (variant) {
    const v = sub.variants.find(v => v.label === variant);
    if (v) return { gst_rate: v.tax_rate, hsn_code: v.hsn_code };
  }
  
  // Senior Fix: Fallback to the first variant's tax and HSN if variant is not specified
  return { gst_rate: sub.variants[0].tax_rate, hsn_code: sub.variants[0].hsn_code };
}
