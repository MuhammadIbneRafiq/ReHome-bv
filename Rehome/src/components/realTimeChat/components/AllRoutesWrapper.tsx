"use client"

import type React from "react"
import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const APP_NAME = "AutoLanding AI"

interface AllRoutesWrapperProps {
  children: React.ReactNode
}

function AllRoutesWrapper({ children }: AllRoutesWrapperProps) {
  const location = useLocation()

  useEffect(() => {
    const pathMatch = /^\/m\/[^/]+$/ // Regex to match /m/{id} where {id} is any non-empty string
    if (!pathMatch.test(location.pathname)) {
      document.title = APP_NAME
    }
  }, [location])

  return <>{children}</>
}

export default AllRoutesWrapper

