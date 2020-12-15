import React, { FC } from 'react'
import { NavigatorProvider, SnackbarProvider } from './providers'

/**
 * Оборачивает приложение в необходимые провайдеры.
 * */
export let Router: FC = ({ children }) => {
  return (
    <NavigatorProvider>
      <SnackbarProvider>{children}</SnackbarProvider>
    </NavigatorProvider>
  )
}
