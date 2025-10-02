import React, { useState, useEffect, useRef } from 'react';
import * as api from '../services/apiService.ts';
import { useTranslation } from '../i18n/i18n.tsx';
import type { UserRole } from '../types.ts';
import { Users, MessageSquare, ThumbsUp } from 'lucide-react';

// Since Chart.js is loaded from a CDN, we declare it globally for TypeScript
declare const Chart: any;

interface ChartComponentProps {
    type: 'bar' | 'doughnut' | 'line' | 'pie';
    data: any;
    options?: any;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ type, data, options }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartRef = useRef<any>(null);

    useEffect(() => {
        if (canvasRef.current) {
            // Destroy previous chart instance if it exists
            if (chartRef.current) {
                chartRef.current.destroy();
            }

            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                chartRef.current = new Chart(ctx, {
                    type,
                    data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        ...options,
                    },
                });
            }
        }

        // Cleanup function to destroy chart on component unmount
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [type, data, options]);

    return <div className="relative h-80"><canvas ref={canvasRef} /></div>;
};


export const InfographicsDashboard: React.FC = () => {
    const { t } = useTranslation();
    const [roleData, setRoleData] = useState<any>(null);
    const [activityData, setActivityData] = useState<any>(null);
    const [feedbackData, setFeedbackData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [roles, activity, feedback] = await Promise.all([
                api.getUserRoleDistribution(),
                api.getChatActivity(),
                api.getFeedbackStats(),
            ]);

            // Prepare User Roles Chart Data
            const roleLabels = Object.keys(roles).map(role => t(`roles.${role as UserRole}`));
            const roleCounts = Object.values(roles);
            setRoleData({
                labels: roleLabels,
                datasets: [{
                    label: t('users'),
                    data: roleCounts,
                    backgroundColor: ['#EF4444', '#F59E0B', '#FBBF24', '#84CC16', '#3B82F6'],
                    hoverOffset: 4
                }]
            });

            // Prepare Chat Activity Chart Data
            const activityLabels = activity.map(a => new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}));
            const activityCounts = activity.map(a => a.count);
            setActivityData({
                labels: activityLabels,
                datasets: [{
                    label: t('conversations'),
                    data: activityCounts,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            });

            // Prepare Feedback Ratio Chart Data
            setFeedbackData({
                labels: [t('goodFeedback'), t('badFeedback')],
                datasets: [{
                    label: 'Feedback',
                    data: [feedback.good, feedback.bad],
                    backgroundColor: ['#22C55E', '#EF4444'],
                    hoverOffset: 4
                }]
            });

            setIsLoading(false);
        };
        fetchData();
    }, [t]);

    if (isLoading) {
        return <div className="flex justify-center items-center p-8"><p>{t('loading')}...</p></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* User Roles Chart */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5" />{t('userRolesDistribution')}</h3>
                    {roleData && <ChartComponent type="doughnut" data={roleData} />}
                </div>

                {/* Feedback Ratio Chart */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                     <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><ThumbsUp className="w-5 h-5" />{t('feedbackRatio')}</h3>
                     {feedbackData && <ChartComponent type="pie" data={feedbackData} />}
                </div>
            </div>
            
            {/* Chat Activity Chart */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" />{t('chatActivityLast30Days')}</h3>
                {activityData && <ChartComponent type="bar" data={activityData} options={{ scales: { y: { beginAtZero: true } } }} />}
            </div>
        </div>
    );
};