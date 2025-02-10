"use client"

import type React from "react"
import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react"

type UiState = {
  isConnecting: boolean
  isConnected: boolean
  isReconnecting: boolean
  showMenu: boolean
}

type UiAction =
  | { type: "CONNECTING" }
  | { type: "CONNECTED" }
  | { type: "DISCONNECTED" }
  | { type: "RECONNECTING" }
  | { type: "RECONNECTED" }
  | { type: "TOGGLE_MENU" }

type UiContextType = {
  state: UiState
  dispatch: React.Dispatch<UiAction>
}

const UiContext = createContext<UiContextType | undefined>(undefined)

const initialState: UiState = {
  isConnecting: true,
  isConnected: false,
  isReconnecting: false,
  showMenu: false,
}

const reducer = (state: UiState, action: UiAction): UiState => {
  switch (action.type) {
    case "CONNECTING":
      return { ...state, isConnecting: true, isConnected: false }
    case "CONNECTED":
      return { ...state, isConnecting: false, isConnected: true }
    case "DISCONNECTED":
      return { ...state, isConnecting: false, isConnected: false }
    case "RECONNECTING":
      return { ...state, isReconnecting: true }
    case "RECONNECTED":
      return { ...state, isReconnecting: false }
    case "TOGGLE_MENU":
      return { ...state, showMenu: !state.showMenu }
    default:
      return state
  }
}

interface UiProviderProps {
  children: ReactNode
}

export const UiProvider: React.FC<UiProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const handleResize = () => {
      dispatch({ type: "TOGGLE_MENU" })
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const value = { state, dispatch }

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export const useUi = (): UiContextType => {
  const context = useContext(UiContext)
  if (context === undefined) {
    throw new Error("useUi must be used within a UiProvider")
  }
  return context
}

