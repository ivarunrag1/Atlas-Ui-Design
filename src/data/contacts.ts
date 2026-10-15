/** Contact records for the Contacts list + detail view. */

export interface ContactSummary {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  lastDealDate: string;
  dealsCount: number;
  owner: string;
  tags: string[];
  created: string;
  tasks: number;
  notes: number;
  files: number;
}

export const contacts: ContactSummary[] = [
  { id: 'AT-CON-0142', name: 'Marcus Reed', company: 'Orbit Manufacturing', role: 'Procurement Lead', email: 'marcus.reed@orbitmfg.com', phone: '+1 312 555 0142', location: 'Chicago · US', lastDealDate: '13 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Decision maker', 'Shipper'], created: '05 Oct 2026', tasks: 2, notes: 3, files: 4 },
  { id: 'AT-CON-0138', name: 'Lena Fischer', company: 'Nordwind Logistics', role: 'Logistics Manager', email: 'lena.fischer@nordwind.com', phone: '+49 40 555 0138', location: 'Hamburg · DE', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Forwarder'], created: '02 Oct 2026', tasks: 1, notes: 2, files: 3 },
  { id: 'AT-CON-0151', name: 'Kenji Sato', company: 'Takara Industries', role: 'Supply Chain Head', email: 'kenji.sato@takara-ind.jp', phone: '+81 45 555 0151', location: 'Yokohama · JP', lastDealDate: '09 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Shipper'], created: '28 Sep 2026', tasks: 3, notes: 1, files: 2 },
  { id: 'AT-CON-0155', name: 'Priya Menon', company: 'Vellore Textiles', role: 'Export Manager', email: 'priya.menon@velloretex.in', phone: '+91 44 555 0155', location: 'Chennai · IN', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Exporter'], created: '10 Oct 2026', tasks: 1, notes: 0, files: 1 },
  { id: 'AT-CON-0129', name: 'Mateo Rojas', company: 'Andes Copper Co', role: 'Procurement Dir', email: 'mateo.rojas@andescopper.cl', phone: '+56 32 555 0129', location: 'Valparaíso · CL', lastDealDate: '08 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Decision maker'], created: '20 Sep 2026', tasks: 0, notes: 2, files: 5 },
  { id: 'AT-CON-0133', name: 'Erik Lindqvist', company: 'Baltic Steel', role: 'Logistics Lead', email: 'erik.lindqvist@balticsteel.se', phone: '+46 31 555 0133', location: 'Gothenburg · SE', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Shipper'], created: '24 Sep 2026', tasks: 4, notes: 1, files: 2 },
  { id: 'AT-CON-0160', name: 'Omar Hassan', company: 'Cairo Agro Exports', role: 'Trade Manager', email: 'omar.hassan@cairoagro.eg', phone: '+20 3 555 0160', location: 'Alexandria · EG', lastDealDate: '11 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Exporter'], created: '08 Oct 2026', tasks: 1, notes: 1, files: 1 },
  { id: 'AT-CON-0147', name: 'Tran Minh', company: 'Saigon Furniture', role: 'Export Lead', email: 'tran.minh@saigonfurn.vn', phone: '+84 28 555 0147', location: 'Ho Chi Minh · VN', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Exporter'], created: '06 Oct 2026', tasks: 2, notes: 0, files: 1 },
  { id: 'AT-CON-0162', name: 'Hana Ono', company: 'Pacific Greens', role: 'Ops Manager', email: 'hana.ono@pacificgreens.nz', phone: '+64 9 555 0162', location: 'Auckland · NZ', lastDealDate: '08 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Shipper'], created: '30 Sep 2026', tasks: 0, notes: 1, files: 0 },
  { id: 'AT-CON-0118', name: 'Aino Virtanen', company: 'Helsinki Pharma', role: 'Supply Chain Mgr', email: 'aino.virtanen@helsinkipharma.fi', phone: '+358 9 555 0118', location: 'Helsinki · FI', lastDealDate: '05 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Decision maker'], created: '12 Sep 2026', tasks: 0, notes: 4, files: 3 },
  { id: 'AT-CON-0144', name: 'Fatou Diop', company: 'Dakar Minerals', role: 'Procurement Head', email: 'fatou.diop@dakarminerals.sn', phone: '+221 33 555 0144', location: 'Dakar · SN', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Decision maker'], created: '01 Oct 2026', tasks: 3, notes: 2, files: 4 },
  { id: 'AT-CON-0158', name: 'Claire Dubois', company: 'Lyon Automotive', role: 'Logistics Manager', email: 'claire.dubois@lyonauto.fr', phone: '+33 4 555 0158', location: 'Lyon · FR', lastDealDate: '12 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Shipper'], created: '09 Oct 2026', tasks: 1, notes: 1, files: 1 },
  { id: 'AT-CON-0126', name: 'Ingrid Hansen', company: 'Oslo Seafood', role: 'Export Manager', email: 'ingrid.hansen@osloseafood.no', phone: '+47 22 555 0126', location: 'Oslo · NO', lastDealDate: '11 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Exporter'], created: '26 Sep 2026', tasks: 2, notes: 2, files: 2 },
  { id: 'AT-CON-0109', name: 'Rahul Kapoor', company: 'Mumbai Spices', role: 'Trade Lead', email: 'rahul.kapoor@mumbaispices.in', phone: '+91 22 555 0109', location: 'Mumbai · IN', lastDealDate: '04 Oct 2026', dealsCount: 1, owner: 'Varun Reddy', tags: ['Exporter'], created: '15 Sep 2026', tasks: 0, notes: 1, files: 1 },
];
