'use client';

import { useState } from 'react';

const skills = [
  { id: '1', name: 'Python编程', category: '编程', difficulty: '初级' },
  { id: '2', name: '数据分析', category: '数据', difficulty: '中级' },
  { id: '3', name: '机器学习', category: 'AI', difficulty: '高级' },
  { id: '4', name: '智能合约', category: '区块链', difficulty: '中级' },
];

export default function TrainingPage() {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [isTraining, setIsTraining] = useState(false);

  const startTraining = () => {
    if (!selectedSkill) return;
    setIsTraining(true);
    // 模拟训练过程
    setTimeout(() => {
      setIsTraining(false);
      alert('训练完成！进化证明已颁发。');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">图书馆 / 训练场</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 技能列表 */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">选择技能</h2>
            
            <div className="space-y-3">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    selectedSkill === skill.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{skill.name}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      skill.difficulty === '初级' ? 'bg-green-600' :
                      skill.difficulty === '中级' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {skill.difficulty}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{skill.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 训练控制 */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">训练控制</h2>
            
            {selectedSkill ? (
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 mb-2">已选择技能</p>
                  <p className="text-lg font-medium">
                    {skills.find(s => s.id === selectedSkill)?.name}
                  </p>
                </div>

                <div>
                  <p className="text-gray-400 mb-2">训练路径</p>
                  <select className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600">
                    <option>标准训练（基础级）</option>
                    <option>强化学习（进阶级）</option>
                    <option>元学习（专家级）</option>
                  </select>
                </div>

                <button
                  onClick={startTraining}
                  disabled={isTraining}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {isTraining ? '训练中...' : '开始训练'}
                </button>

                {isTraining && (
                  <div className="mt-4">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 animate-pulse w-full"></div>
                    </div>
                    <p className="text-center text-sm text-gray-400 mt-2">正在进化中...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                请选择一个技能开始训练
              </div>
            )}
          </div>
        </div>

        {/* 进化识别三轨制说明 */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">进化识别三轨制</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="font-medium text-green-400 mb-2">基础级</h3>
              <p className="text-sm text-gray-400">完成训练场训练，通过考核</p>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="font-medium text-blue-400 mb-2">进阶级</h3>
              <p className="text-sm text-gray-400">通过RL/微调进化，AgentEvolver认证</p>
            </div>
            
            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="font-medium text-purple-400 mb-2">专家级</h3>
              <p className="text-sm text-gray-400">代码自我进化，Foundry认证</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
