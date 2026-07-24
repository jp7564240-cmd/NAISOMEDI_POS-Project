export type NavItem = { id: string; label: string; icon: string; route: string; isSystem?: boolean };
export const defaultNavItems: NavItem[] = [
  {id:'home',label:'Home',icon:'⌂',route:'home',isSystem:true}, {id:'dashboard',label:'Dashboard',icon:'▦',route:'dashboard'}, {id:'pos',label:'Point of Sale',icon:'▣',route:'pos'}, {id:'inventory',label:'Inventory',icon:'▤',route:'inventory'}, {id:'categories',label:'Categories',icon:'◇',route:'categories'}, {id:'reports',label:'Reports',icon:'▥',route:'reports'}, {id:'designer',label:'Receipt Designer',icon:'✦',route:'designer',isSystem:true}, {id:'settings',label:'Settings',icon:'⚙',route:'settings',isSystem:true}
];
