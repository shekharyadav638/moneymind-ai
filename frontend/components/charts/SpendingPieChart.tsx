import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface CategoryData {
  _id: string;
  total: number;
  count?: number;
}

interface SpendingPieChartProps {
  data: CategoryData[];
  totalSpend: number;
}

// Simple SVG pie chart implementation (no external dependency issues)
const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
  const rad = ((angle - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
};

export const SpendingPieChart: React.FC<SpendingPieChartProps> = ({ data, totalSpend }) => {
  if (!data || data.length === 0 || totalSpend === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No spending data yet</Text>
      </View>
    );
  }

  const cx = 90;
  const cy = 90;
  const r = 70;
  const innerR = 40;

  // Sort by total descending, take top 6
  const sorted = [...data].sort((a, b) => b.total - a.total).slice(0, 6);
  const chartTotal = sorted.reduce((s, d) => s + d.total, 0);

  let currentAngle = 0;
  const slices = sorted.map((item) => {
    const sliceAngle = (item.total / chartTotal) * 360;
    const path = arcPath(cx, cy, r, currentAngle, currentAngle + sliceAngle);
    const innerPath = arcPath(cx, cy, innerR, currentAngle, currentAngle + sliceAngle);
    const color = (Colors.categoryColors as any)[item._id] || Colors.text.muted;
    const start = currentAngle;
    currentAngle += sliceAngle;
    return { path, color, item, start };
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={180} height={180} viewBox="0 0 180 180">
          <G>
            {slices.map((slice, i) => (
              <Path key={i} d={slice.path} fill={slice.color} opacity={0.9} />
            ))}
            {/* Inner white circle for donut effect */}
            <Circle cx={cx} cy={cy} r={innerR} fill={Colors.surface} />
          </G>
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={styles.centerAmount}>
            {totalSpend >= 100000 ? `₹${(totalSpend / 100000).toFixed(1)}L` : `₹${(totalSpend / 1000).toFixed(1)}K`}
          </Text>
          <Text style={styles.centerSubtext}>Spent</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {slices.map((slice, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{slice.item._id}</Text>
            <Text style={styles.legendPercent}>
              {((slice.item.total / chartTotal) * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  chartContainer: {
    position: 'relative',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAmount: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  centerSubtext: {
    color: Colors.text.muted,
    fontSize: 11,
  },
  legend: {
    flex: 1,
    paddingLeft: 16,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    color: Colors.text.secondary,
    fontSize: 12,
  },
  legendPercent: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: 14,
  },
});
