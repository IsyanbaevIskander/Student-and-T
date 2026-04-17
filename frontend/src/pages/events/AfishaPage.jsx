import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, ArrowRight, Loader2 } from 'lucide-react';
import { eventsApi } from '../../api/events';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const AfishaPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await eventsApi.getPublicEvents();
                setEvents(data);
            } catch (err) {
                console.error('Error fetching events:', err);
                setError('Не удалось загрузить афишу');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Загружаем интересные события...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <header className="mb-12 text-center">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                >
                    Афиша мероприятий
                </motion.h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Откройте для себя новые возможности: воркшопы, лекции и нетворкинг в наших хабах.
                </p>
            </header>

            {error ? (
                <div className="bg-red-50 rounded-[40px] p-12 text-center border border-red-100 max-w-xl mx-auto">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                         <MapPin className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-red-900 mb-2">{error}</h3>
                    <p className="text-red-600/60 mb-8">Возможно, сервер временно недоступен. Попробуйте обновить страницу.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition"
                    >
                        Обновить
                    </button>
                </div>
            ) : events.length === 0 ? (
                <div className="bg-white rounded-[40px] p-20 text-center shadow-sm border border-gray-100 animate-fade-in">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Пока ничего не запланировано</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Загляните позже или создайте собственное мероприятие в одном из наших хабов!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="group bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 border border-gray-100 flex flex-col"
                        >
                            <div className="h-56 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-tbank-yellow/20 to-tbank-yellow/5 group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Calendar className="w-16 h-16 text-tbank-yellow/30 group-hover:rotate-12 transition-transform duration-500" />
                                </div>
                                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black text-black shadow-sm uppercase tracking-widest border border-white/50">
                                    {event.is_public ? '🌐 Публичное' : '🔒 Приватное'}
                                </div>
                                <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-bold text-white shadow-sm border border-white/10">
                                    {event.hub?.name || 'Хаб'}
                                </div>
                            </div>
                            
                            <div className="p-8 flex-grow flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Открыта регистрация</span>
                                </div>
                                
                                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-tbank-yellow transition-colors line-clamp-2">
                                    {event.title}
                                </h3>
                                
                                <p className="text-gray-500 text-sm mb-8 line-clamp-3 leading-relaxed">
                                    {event.description || 'Приглашаем на наше новое мероприятие! Вас ждут интересные обсуждения и новые знакомства.'}
                                </p>
                                
                                <div className="space-y-4 mb-8 mt-auto">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                                        <div className="flex items-center text-sm text-gray-600 font-bold">
                                            <Calendar className="w-4 h-4 mr-3 text-tbank-yellow" />
                                            <span>
                                                {format(new Date(event.start_time), 'd MMMM', { locale: ru })}
                                            </span>
                                        </div>
                                        <span className="text-sm font-black text-gray-900">
                                            {format(new Date(event.start_time), 'HH:mm', { locale: ru })}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between px-4">
                                        <div className="flex items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                                            <Users className="w-3 h-3 mr-2" />
                                            <span>Участники</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-tbank-yellow transition-all duration-1000" 
                                                    style={{ width: `${Math.min(100, (event.attendees_count / event.max_attendees) * 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-black text-gray-900">
                                                {event.attendees_count}/{event.max_attendees}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Link 
                                    to={`/events/join/${event.invite_code}`}
                                    className="w-full py-5 bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-3 group/btn hover:bg-tbank-yellow hover:text-black transition-all duration-300 shadow-xl"
                                >
                                    <span>Участвовать</span>
                                    <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AfishaPage;
