'use client'

import { useActionState, useEffect } from "react"

//Importa o JS do Bootstrap apenas no navegador
//Necessário porque o Bootstrap acessa o 'window', que não existe no navegador
export default function BootstrapClient() {
    useEffect(() => {
        import ('bootstrap/dist/js/bootstrap.bundle.min.js')
    }, [])

    return null //não renderiza nada visualmente 
} 