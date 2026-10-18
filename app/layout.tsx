import type {Metadata} from 'next';import './globals.css';import {Shell} from '@/components/shell';
export const metadata:Metadata={title:'ARC // Ethereum Launch Intelligence',description:'Multi-token on-chain launch analysis and evidence-based Ethereum launch planning'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><Shell>{children}</Shell></body></html>}
