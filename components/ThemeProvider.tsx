'use client';
import {useEffect} from 'react';
export default function ThemeProvider(){useEffect(()=>{const saved=localStorage.getItem('theme')||'system';const apply=(v:string)=>{document.documentElement.dataset.theme=v==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):v};apply(saved);const m=matchMedia('(prefers-color-scheme: dark)');const f=()=>{if((localStorage.getItem('theme')||'system')==='system')apply('system')};m.addEventListener('change',f);return()=>m.removeEventListener('change',f)},[]);return null}
