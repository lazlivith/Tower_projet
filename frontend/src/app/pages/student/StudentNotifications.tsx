import { useState } from 'react';
import { Bell, CheckCircle, Trash2, Filter } from 'lucide-react';
import { studentNotifications } from '../../data/mockData';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState(studentNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notifId: string) => {
    setNotifications(notifications.map(n =>
      n.id === notifId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notifId: string) => {
    if (confirm('Supprimer cette notification ?')) {
      setNotifications(notifications.filter(n => n.id !== notifId));
    }
  };

  const deleteAllRead = () => {
    if (confirm('Supprimer toutes les notifications lues ?')) {
      setNotifications(notifications.filter(n => !n.read));
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return '📝';
      case 'grade':
        return '⭐';
      case 'announcement':
        return '📢';
      case 'certificate':
        return '🏆';
      default:
        return '🔔';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2">Notifications</h2>
            <p className="text-gray-600">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''} sur {notifications.length}
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-[#FFC107] text-[#1A1A2E] rounded-lg hover:bg-[#FFD54F] transition-colors text-sm flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Tout marquer comme lu
              </button>
            )}
            <button
              onClick={deleteAllRead}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer les lues
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-semibold mr-4">Filtrer:</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-[#FFC107] text-[#1A1A2E]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Toutes ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'unread'
                ? 'bg-[#FFC107] text-[#1A1A2E]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Non lues ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'read'
                ? 'bg-[#FFC107] text-[#1A1A2E]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Lues ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="mb-2 text-gray-600">Aucune notification</h3>
            <p className="text-sm text-gray-500">
              {filter === 'unread' && 'Toutes vos notifications sont lues'}
              {filter === 'read' && 'Aucune notification lue'}
              {filter === 'all' && 'Vous n\'avez pas encore de notifications'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-lg shadow-md p-6 transition-all ${
                !notif.read ? 'border-l-4 border-[#FFC107]' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`mb-2 ${!notif.read ? 'font-semibold' : 'text-gray-700'}`}>
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Il y a {notif.time}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      notif.type === 'assignment' ? 'bg-blue-100 text-blue-800' :
                      notif.type === 'grade' ? 'bg-green-100 text-green-800' :
                      notif.type === 'announcement' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {notif.type === 'assignment' && 'Devoir'}
                      {notif.type === 'grade' && 'Note'}
                      {notif.type === 'announcement' && 'Annonce'}
                      {notif.type === 'certificate' && 'Certificat'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Marquer comme lu"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
