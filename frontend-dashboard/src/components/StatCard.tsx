import React from 'react';
import type { StatCardProps } from '../types';

/**
 * 统计卡片组件
 */
export const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  title, 
  value, 
  color,
  subtitle 
}) => {
  return (
    <div 
      className="stat-card"
      style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: `2px solid ${color}20`,
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '12px' 
      }}>
        <div style={{ color, fontSize: '24px' }}>
          {icon}
        </div>
        <div style={{ 
          color: '#666', 
          fontSize: '14px',
          fontWeight: 500 
        }}>
          {title}
        </div>
      </div>
      <div style={{ 
        fontSize: '32px', 
        fontWeight: 'bold', 
        color,
        marginBottom: subtitle ? '8px' : 0
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '13px',
          color: '#999',
          marginTop: '8px'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;
