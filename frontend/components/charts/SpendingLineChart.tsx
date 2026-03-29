import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { Colors } from '../../constants/colors';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 120;

interface MonthlyData {
  _id: { year: number; month: number };
  total: number;
}

interface SpendingLineChartProps {
  data: MonthlyData[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const SpendingLineChart: React.FC<SpendingLineChartProps> = ({ data }) => {
  if (!data || data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Need more data for chart</Text>
      </View>
    );
  }

  const values = data.map((d) => d.total);
  const maxVal = Math.max(...values) * 1.2 || 1;
  const minVal = 0;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * CHART_WIDTH,
    y: CHART_HEIGHT - ((d.total - minVal) / (maxVal - minVal)) * CHART_HEIGHT,
    month: MONTHS[d._id.month - 1],
    value: d.total,
  }));

  // Build smooth line path
  let linePath = `M ${points[0].x} ${points[0].y}`;
  let areaPath = `M ${points[0].x} ${CHART_HEIGHT}`;
  areaPath += ` L ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    linePath += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
    areaPath += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
  }
  areaPath += ` L ${points[points.length - 1].x} ${CHART_HEIGHT} Z`;

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30} style={styles.svg}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.4} />
            <Stop offset="100%" stopColor={Colors.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {/* Area fill */}
        <Path d={areaPath} fill="url(#areaGrad)" />
        {/* Line */}
        <Path d={linePath} stroke={Colors.primary} strokeWidth={2.5} fill="none" />
        {/* Data points */}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={4} fill={Colors.primary} stroke={Colors.background} strokeWidth={2} />
        ))}
        {/* Month labels */}
        {points.map((p, i) => (
          <View key={i} />
        ))}
      </Svg>
      {/* X-axis labels */}
      <View style={[styles.xLabels, { width: CHART_WIDTH }]}>
        {points.map((p, i) => (
          <Text key={i} style={[styles.xLabel, { left: p.x - 16 }]}>
            {p.month}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  svg: {
    overflow: 'visible',
  },
  xLabels: {
    position: 'relative',
    height: 20,
    marginTop: 4,
  },
  xLabel: {
    position: 'absolute',
    color: Colors.text.muted,
    fontSize: 11,
    width: 32,
    textAlign: 'center',
  },
  empty: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.text.muted,
    fontSize: 13,
  },
});
