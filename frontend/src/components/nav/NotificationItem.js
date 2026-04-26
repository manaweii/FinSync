import React from 'react';
import { 
  UserPlusIcon, 
  CreditCardIcon, 
  ExclamationCircleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const NotificationItem = ({ type, title, message, time, onRead }) => {
  // Logic to define styles and icons based on notification type
  const config = {
    account_created: {
      icon: <UserPlusIcon className="h-6 w-6 text-blue-600" />,
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    payment_update: {
      icon: <CreditCardIcon className="h-6 w-6 text-amber-600" />,
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    account_disabled: {
      icon: <ExclamationCircleIcon className="h-6 w-6 text-red-600" />,
      bg: "bg-red-50",
      border: "border-red-100",
    }
  };

  const { icon, bg, border } = config[type] || config.account_created;

  return (
    <div className={`flex p-4 mb-3 border rounded-lg shadow-sm transition-all hover:shadow-md ${bg} ${border}`}>
      <div className="flex-shrink-0 mr-4">
        <div className="p-2 bg-white rounded-full shadow-inner">
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-bold text-gray-900">{title}</h4>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-sm text-gray-700 mt-1">{message}</p>
      </div>
      <button 
        onClick={onRead}
        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default NotificationItem;