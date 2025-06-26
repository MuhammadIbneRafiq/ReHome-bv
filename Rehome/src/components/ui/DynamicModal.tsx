import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface ModalConfig {
  id: string;
  component: React.ComponentType<any>;
  props?: any;
  options?: {
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closeOnOverlay?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    className?: string;
    overlayClassName?: string;
  };
}

interface DynamicModalContextType {
  openModal: (config: ModalConfig) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  isModalOpen: (id: string) => boolean;
  getActiveModals: () => ModalConfig[];
}

const DynamicModalContext = React.createContext<DynamicModalContextType | null>(null);

export const useDynamicModal = () => {
  const context = React.useContext(DynamicModalContext);
  if (!context) {
    throw new Error('useDynamicModal must be used within a DynamicModalProvider');
  }
  return context;
};

interface DynamicModalProviderProps {
  children: React.ReactNode;
}

export const DynamicModalProvider: React.FC<DynamicModalProviderProps> = ({ children }) => {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  const openModal = useCallback((config: ModalConfig) => {
    setModals(prev => {
      // Remove existing modal with same ID
      const filtered = prev.filter(modal => modal.id !== config.id);
      return [...filtered, config];
    });
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => prev.filter(modal => modal.id !== id));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const isModalOpen = useCallback((id: string) => {
    return modals.some(modal => modal.id === id);
  }, [modals]);

  const getActiveModals = useCallback(() => {
    return [...modals];
  }, [modals]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && modals.length > 0) {
        const topModal = modals[modals.length - 1];
        if (topModal.options?.closeOnEscape !== false) {
          closeModal(topModal.id);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modals, closeModal]);

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (modals.length > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modals.length]);

  const contextValue = useMemo(() => ({
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getActiveModals
  }), [openModal, closeModal, closeAllModals, isModalOpen, getActiveModals]);

  return (
    <DynamicModalContext.Provider value={contextValue}>
      {children}
      <DynamicModalRenderer modals={modals} onClose={closeModal} />
    </DynamicModalContext.Provider>
  );
};

interface DynamicModalRendererProps {
  modals: ModalConfig[];
  onClose: (id: string) => void;
}

const DynamicModalRenderer: React.FC<DynamicModalRendererProps> = ({ modals, onClose }) => {
  if (typeof document === 'undefined') return null;

  const getSizeClasses = (size: string = 'md') => {
    switch (size) {
      case 'sm': return 'max-w-md';
      case 'md': return 'max-w-2xl';
      case 'lg': return 'max-w-4xl';
      case 'xl': return 'max-w-6xl';
      case 'full': return 'max-w-full h-full';
      default: return 'max-w-2xl';
    }
  };

  return createPortal(
    <AnimatePresence>
      {modals.map((modal, index) => {
        const { id, component: Component, props = {}, options = {} } = modal;
        const {
          size = 'md',
          closeOnOverlay = true,
          showCloseButton = true,
          className = '',
          overlayClassName = ''
        } = options;

        return (
          <motion.div
            key={id}
            className={`fixed inset-0 flex items-center justify-center backdrop-blur-sm ${overlayClassName}`}
            style={{
              zIndex: 1000 + index,
              backgroundColor: `rgba(0, 0, 0, ${0.3 + (index * 0.1)})`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnOverlay ? () => onClose(id) : undefined}
          >
            <motion.div
              className={`relative bg-white rounded-xl shadow-2xl mx-4 my-8 ${getSizeClasses(size)} ${className}`}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxHeight: size === 'full' ? '100vh' : '90vh',
                overflow: 'auto'
              }}
            >
              {showCloseButton && (
                <button
                  onClick={() => onClose(id)}
                  className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ fontSize: '24px', lineHeight: '1' }}
                >
                  ×
                </button>
              )}
              
              <div className="p-6">
                <Component {...props} onClose={() => onClose(id)} />
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </AnimatePresence>,
    document.body
  );
};

// Hook for common modal operations
export const useModal = (id: string) => {
  const { openModal, closeModal, isModalOpen } = useDynamicModal();

  const open = useCallback((component: React.ComponentType<any>, props?: any, options?: ModalConfig['options']) => {
    openModal({ id, component, props, options });
  }, [id, openModal]);

  const close = useCallback(() => {
    closeModal(id);
  }, [id, closeModal]);

  const isOpen = isModalOpen(id);

  return { open, close, isOpen };
};

export default DynamicModalProvider; 