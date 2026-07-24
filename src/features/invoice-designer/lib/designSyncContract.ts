'use client';
import { useCallback, useState } from 'react';
export type DesignContract={colors:{accent:string;ink:string};layout:{paperWidth:number};seal:{enabled:boolean};logo:string};
const defaultContract:DesignContract={colors:{accent:'#d8b15b',ink:'#19162b'},layout:{paperWidth:80},seal:{enabled:true},logo:'NaiSoMedi'};
export function useDesignSyncContract(){const [contract,setContract]=useState(defaultContract);return {contract,publish:useCallback((value:Partial<DesignContract>)=>setContract(current=>({...current,...value})),[])}}
