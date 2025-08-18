import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Award, Zap, Target, Calendar, BarChart3 } from 'lucide-react';

const AdvancedAnalyticsDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('3months');
  const [selectedMetric, setSelectedMetric] = useState('volume');
  
  // Mock data - in real implementation, this would come from your workout tracking
  const workoutData = [
    { date: '2024-01', volume: 15420, intensity: 7.2, frequency: 4, fatigue: 3.1 },
    { date: '2024-02', volume: 16800, intensity: 7.5, frequency: 4.2, fatigue: 3.4 },
    { date: '2024-03', volume: 18200, intensity: 7.8, frequency: 4.5, fatigue: 3.8 },
    { date: '2024-04', volume: 17600, intensity: 7.4, frequency: 4.1, fatigue: 4.2 },
    { date: '2024-05', volume: 19500, intensity: 8.1, frequency: 4.8, fatigue: 3.9 },
    { date: '2024-06', volume: 21200, intensity: 8.4, frequency: 5.0, fatigue: 4.1 }
  ];

  const exerciseProgressData = [
    { exercise: 'Squat', week1: 225, week4: 245, week8: 265, week12: 285 },
    { exercise: 'Bench', week1: 185, week4: 195, week8: 210, week12: 225 },
    { exercise: 'Deadlift', week1: 315, week4: 335, week8: 365, week12: 385 },
    { exercise: 'OHP', week1: 135, week4: 145, week8: 155, week12: 165 }
  ];

  const muscleGroupData = [
    { muscle: 'Chest', volume: 850, development: 8.2 },
    { muscle: 'Back', volume: 920, development: 8.7 },
    { muscle: 'Legs', volume: 1240, development: 9.1 },
    { muscle: 'Shoulders', volume: 680, development: 7.8 },
    { muscle: 'Arms', volume: 540, development: 7.5 }
  ];

  const performanceRadarData = [
    { metric: 'Strength', value: 85, fullMark: 100 },
    { metric: 'Endurance', value: 72, fullMark: 100 },
    { metric: 'Power', value: 78, fullMark: 100 },
    { metric: 'Flexibility', value: 65, fullMark: 100 },
    { metric: 'Recovery', value: 82, fullMark: 100 },
    { metric: 'Consistency', value: 91, fullMark: 100 }
  ];

  const volumeDistribution = [
    { day: 'Mon', volume: 3200, sets: 14 },
    { day: 'Tue', volume: 2800, sets: 12 },
    { day: 'Wed', volume: 0, sets: 0 },
    { day: 'Thu', volume: 3600, sets: 16 },
    { day: 'Fri', volume: 3100, sets: 13 },
    { day: 'Sat', volume: 2900, sets: 12 },
    { day: 'Sun', volume: 0, sets: 0 }
  ];

  const MetricCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change}% from last month
          </p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Training Analytics</h1>
          <p className="text-gray-400">Advanced insights into your training performance</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {['1month', '3months', '6months', '1year'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedTimeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {range === '1month' ? '1M' : range === '3months' ? '3M' : range === '6months' ? '6M' : '1Y'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Volume"
            value="21.2K lbs"
            change={8.7}
            icon={TrendingUp}
            color="text-blue-400"
          />
          <MetricCard
            title="Training Intensity"
            value="8.4/10"
            change={3.2}
            icon={Zap}
            color="text-yellow-400"
          />
          <MetricCard
            title="Weekly Frequency"
            value="5.0 sessions"
            change={12.5}
            icon={Calendar}
            color="text-green-400"
          />
          <MetricCard
            title="PRs This Month"
            value="7"
            change={40.0}
            icon={Award}
            color="text-purple-400"
          />
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Volume Progression */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Volume Progression</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={workoutData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Radar */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Performance Profile</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceRadarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exercise Progress & Weekly Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Exercise Progress */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Strength Progression</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={exerciseProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="exercise" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="week1" stroke="#EF4444" strokeWidth={2} name="Week 1" />
                <Line type="monotone" dataKey="week4" stroke="#F59E0B" strokeWidth={2} name="Week 4" />
                <Line type="monotone" dataKey="week8" stroke="#10B981" strokeWidth={2} name="Week 8" />
                <Line type="monotone" dataKey="week12" stroke="#3B82F6" strokeWidth={2} name="Week 12" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Volume Distribution */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Weekly Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={volumeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="volume" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Muscle Group Analysis */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Muscle Group Development</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {muscleGroupData.map((muscle) => (
              <div key={muscle.muscle} className="text-center">
                <div className="mb-2">
                  <div className="text-sm text-gray-400">{muscle.muscle}</div>
                  <div className="text-lg font-semibold text-white">{muscle.volume}</div>
                  <div className="text-xs text-gray-500">lbs/week</div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                    style={{ width: `${muscle.development * 10}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">{muscle.development}/10</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-700">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Target className="w-6 h-6 mr-2" />
            AI Training Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Performance Trends</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Your squat strength has increased 26% in 12 weeks</li>
                <li>• Training volume is optimally progressing at +8.7% monthly</li>
                <li>• Recovery metrics suggest you can handle 5% more volume</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-200 mb-2">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Consider adding more posterior chain work</li>
                <li>• Your Monday sessions show highest performance</li>
                <li>• Flexibility work could improve by 15% with 2x/week focus</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
