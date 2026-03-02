import React from 'react'
import { toast, ToastContainer, ToastOptions } from 'react-toastify'
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from 'react-icons/fi'
import 'react-toastify/dist/ReactToastify.css'

// Custom toast notification functions
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    icon: <FiCheck className="text-green-500" />,
    ...options,
  })
}

export const showErrorToast = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    icon: <FiX className="text-red-500" />,
    ...options,
  })
}

export const showWarningToast = (message: string, options?: ToastOptions) => {
  toast.warning(message, {
    icon: <FiAlertTriangle className="text-yellow-500" />,
    ...options,
  })
}

export const showInfoToast = (message: string, options?: ToastOptions) => {
  toast.info(message, {
    icon: <FiInfo className="text-blue-500" />,
    ...options,
  })
}

// Toast container component
export const AppToastContainer: React.FC = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      className="!top-4 !right-4"
      toastClassName="!bg-[#1a2332] !text-gray-100 !shadow-lg !border !border-[#2a3a4e] !rounded-lg"
      progressClassName="!bg-primary-500"
    />
  )
}
