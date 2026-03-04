'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '../hooks/useTutorial';

const steps = [
  {
    target: '.navbar',
    title: '欢迎使用 GenLoop 3.0',
    content: '这是您的导航栏，可以访问市场、训练场、排行榜等功能。',
    position: 'bottom',
  },
  {
    target: '.connect-button',
    title: '连接钱包',
    content: '点击这里连接您的以太坊钱包，开始您的修仙之旅。',
    position: 'bottom',
  },
  {
    target: '.market-link',
    title: '基因市场',
    content: '在这里您可以浏览和购买其他用户创建的基因NFT。',
    position: 'right',
  },
  {
    target: '.training-link',
    title: '训练场',
    content: '选择技能进行训练，提升您的AI能力并获得进化证明。',
    position: 'right',
  },
  {
    target: '.profile-link',
    title: '个人中心',
    content: '查看您的身份等级、AGC余额、基因资产和进化记录。',
    position: 'left',
  },
];

export function Tutorial() {
  const { isActive, currentStep, nextStep, prevStep, skip, complete } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[currentStep];

  useEffect(() => {
    if (isActive && step) {
      const target = document.querySelector(step.target);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      }
    }
  }, [isActive, currentStep, step]);

  if (!isActive || !step || !targetRect) return null;

  const getTooltipPosition = () => {
    switch (step.position) {
      case 'top':
        return {
          bottom: window.innerHeight - targetRect.top + 10,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          top: targetRect.bottom + 10,
          left: targetRect.left + targetRect.width / 2,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2,
          right: window.innerWidth - targetRect.left + 10,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2,
          left: targetRect.right + 10,
          transform: 'translateY(-50%)',
        };
      default:
        return {};
    }
  };

  return (
    <>
      {/* 遮罩 */}
      <div className="fixed inset-0 bg-black/50 z-40">
        {/* 高亮区域 */}
        <div
          className="absolute bg-transparent border-2 border-blue-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      </div>

      {/* 提示框 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-50 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-2xl w-80"
        style={getTooltipPosition()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold">{step.title}</h3>
          <button onClick={skip} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <p className="text-gray-300 mb-6">{step.content}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-1.5 text-sm bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                上一步
              </button>
            )}
            <button
              onClick={currentStep === steps.length - 1 ? complete : nextStep}
              className="px-3 py-1.5 text-sm bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {currentStep === steps.length - 1 ? '完成' : '下一步'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
