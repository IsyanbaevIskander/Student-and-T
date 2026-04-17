import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { eventsApi } from '../../api/events';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const JoinEventPage = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);
    const [bookingData, setBookingData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await eventsApi.getEventByInvite(code);
                setEvent(data);
            } catch (err) {
                setError(err.response?.data?.detail || 'Мероприятие не найдено или ссылка недействительна');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [code]);

    const handleJoin = async () => {
        setJoining(true);
        setError(null);
        try {
            const result = await eventsApi.joinEvent(code);
            setBookingData(result);
            setJoined(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Не удалось записаться на мероприятие');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Загружаем информацию о встрече...</p>
            </div>
        );
    }

    if (error && !joined) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-sm border border-red-100 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Упс! Ошибка</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button 
                    onClick={() => navigate('/afisha')}
                    className="btn-secondary w-full"
                >
                    Вернуться к афише
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <AnimatePresence mode="wait">
                {!joined ? (
                    <motion.div
                        key="join-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
                    >
                        <div className="bg-gradient-to-r from-primary to-primary-dark p-8 text-white">
                            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
                            <p className="opacity-90">Вы приглашены на мероприятие!</p>
                        </div>
                        
                        <div className="p-8 grid md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">О мероприятии</h3>
                                    <p className="text-gray-700 leading-relaxed">{event.description || 'Описание отсутствует'}</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <Calendar className="w-5 h-5 text-primary mt-1 mr-3" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Когда</p>
                                            <p className="text-gray-600">
                                                {format(new Date(event.start_time), 'd MMMM yyyy, HH:mm', { locale: ru })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <MapPin className="w-5 h-5 text-primary mt-1 mr-3" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Где</p>
                                            <p className="text-gray-600">{event.hub?.name}, {event.hub?.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <Users className="w-5 h-5 text-primary mt-1 mr-3" />
                                        <div>
                                            <p className="font-semibold text-gray-900">Участники</p>
                                            <p className="text-gray-600">Мест: {event.attendees_count} / {event.max_attendees}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center items-center bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
                                <p className="text-gray-600 mb-6">Создано: {event.creator?.email}</p>
                                <button
                                    onClick={handleJoin}
                                    disabled={joining || event.attendees_count >= event.max_attendees}
                                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg ${
                                        joining || event.attendees_count >= event.max_attendees
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-primary text-white hover:bg-primary-dark hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                                >
                                    {joining ? (
                                        <span className="flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Бронируем...
                                        </span>
                                    ) : event.attendees_count >= event.max_attendees ? (
                                        'Мест нет'
                                    ) : (
                                        'Присоединиться'
                                    )}
                                </button>
                                {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success-card"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl shadow-2xl p-12 text-center border border-success/20 max-w-xl mx-auto"
                    >
                        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-success" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Вы записаны!</h2>
                        <p className="text-gray-600 mb-8">
                            Ждем вас на мероприятии <strong>{event.title}</strong>. 
                            Покажите этот QR-код при входе в хаб.
                        </p>
                        
                        <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 inline-block mb-8">
                            <QRCodeSVG 
                                value={bookingData.qr_code} 
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                            <p className="mt-2 text-xs font-mono text-gray-400 select-all">{bookingData.qr_code}</p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="btn-secondary flex-1"
                            >
                                В личный кабинет
                            </button>
                            <button 
                                onClick={() => navigate('/afisha')}
                                className="btn-primary flex-1"
                            >
                                На главную афишу
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default JoinEventPage;
