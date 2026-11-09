import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event, Registration, User } from '../../types';
import { entityId } from '../../utils/registrations';
import { getDistanceMeters } from '../../utils/locationUtils';
import { useAppTheme } from '../../theme/ThemeContext';

interface AdminDashboardChartsProps {
  events: Event[];
  registrations: Registration[];
  users: User[];
  loading?: boolean;
  onSelectEventReport?: (eventId: string) => void;
  onSelectEventQr?: (eventId: string, eventTitle: string) => void;
}

type ColumnFilterMode = 'top' | 'upcoming' | 'attention';
type CategoryMetricMode = 'registrations' | 'events';

interface RingGaugeProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  activeColor: string;
  trackColor: string;
  innerBgColor: string;
  textColor: string;
  subTextColor: string;
  centerSubLabel: string;
}

function RingGauge({
  percent,
  size = 92,
  strokeWidth = 10,
  activeColor,
  trackColor,
  innerBgColor,
  textColor,
  subTextColor,
  centerSubLabel,
}: RingGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const rightDeg = (Math.min(clamped, 50) / 50) * 180;
  const leftDeg = ((Math.max(clamped, 50) - 50) / 50) * 180;
  const innerSize = size - strokeWidth * 2;
  const half = size / 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: half,
        backgroundColor: trackColor,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Half-disc right: covers 0% -> 50% */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: half,
          height: size,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: -half,
            width: size,
            height: size,
            borderRadius: half,
            overflow: 'hidden',
            transform: [{ rotate: `${rightDeg}deg` }],
          }}
        >
          <View
            style={{
              width: half,
              height: size,
              backgroundColor: clamped > 0 ? activeColor : 'transparent',
            }}
          />
        </View>
      </View>

      {/* Half-disc left: covers 50% -> 100% */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: half,
          height: size,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: half,
            overflow: 'hidden',
            transform: [{ rotate: `${leftDeg}deg` }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              right: 0,
              width: half,
              height: size,
              backgroundColor: clamped > 50 ? activeColor : 'transparent',
            }}
          />
        </View>
      </View>

      {/* Inner cutout disc */}
      <View
        style={{
          position: 'absolute',
          top: strokeWidth,
          left: strokeWidth,
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: innerBgColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', color: textColor }}>
          {clamped}%
        </Text>
        <Text
          style={{ fontSize: 9.5, fontWeight: '600', color: subTextColor, marginTop: 1 }}
          numberOfLines={1}
        >
          {centerSubLabel}
        </Text>
      </View>
    </View>
  );
}

const CATEGORY_COLORS = [
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EC4899',
  '#06B6D4',
];

export default function AdminDashboardCharts({
  events,
  registrations,
  users,
  loading = false,
  onSelectEventReport,
  onSelectEventQr,
}: AdminDashboardChartsProps) {
  const { theme, isDark } = useAppTheme();
  const [columnFilter, setColumnFilter] = useState<ColumnFilterMode>('top');
  const [categoryMetric, setCategoryMetric] = useState<CategoryMetricMode>('registrations');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // 1. Tổng hợp số liệu trạng thái tham gia & GPS
  const overviewStats = useMemo(() => {
    const eventById = new Map<string, Event>();
    for (const ev of events) {
      const id = entityId(ev);
      if (id) eventById.set(id, ev);
    }

    let checkedIn = 0;
    let registeredOnly = 0;
    let waitlist = 0;
    let cancelled = 0;
    let gpsCheckedCount = 0;
    let gpsValidCount = 0;
    let gpsViolationCount = 0;

    for (const reg of registrations) {
      if (reg.status === 'checked_in' || reg.status === 'completed') {
        checkedIn++;
        if (reg.checkInMethod !== 'admin_manual' && reg.checkInLocation) {
          const ev = eventById.get(entityId(reg.eventId));
          if (ev?.coordinates?.latitude != null && ev.coordinates?.longitude != null) {
            gpsCheckedCount++;
            const dist = getDistanceMeters(
              reg.checkInLocation.latitude,
              reg.checkInLocation.longitude,
              ev.coordinates.latitude,
              ev.coordinates.longitude
            );
            const limit = ev.coordinates.radiusMeters || 500;
            if (dist <= limit) gpsValidCount++;
            else gpsViolationCount++;
          }
        }
      } else if (reg.status === 'registered') {
        registeredOnly++;
      } else if (reg.status === 'waitlist') {
        waitlist++;
      } else if (reg.status === 'cancelled') {
        cancelled++;
      }
    }

    const officialTotal = checkedIn + registeredOnly;
    const checkInRate = officialTotal > 0 ? (checkedIn / officialTotal) * 100 : 0;

    const eventsWithGps = events.filter(
      (e) => e.coordinates?.latitude != null && e.coordinates?.longitude != null
    ).length;
    const gpsCoveragePercent =
      gpsCheckedCount > 0
        ? (gpsValidCount / gpsCheckedCount) * 100
        : events.length > 0
        ? (eventsWithGps / events.length) * 100
        : 0;

    return {
      checkedIn,
      registeredOnly,
      waitlist,
      cancelled,
      officialTotal,
      checkInRate,
      gpsCheckedCount,
      gpsValidCount,
      gpsViolationCount,
      eventsWithGps,
      gpsCoveragePercent,
    };
  }, [events, registrations]);

  // 2. Dữ liệu biểu đồ cột theo từng sự kiện
  const eventMetricsList = useMemo(() => {
    const now = Date.now();
    return events.map((ev) => {
      const id = entityId(ev);
      const evRegs = registrations.filter((r) => entityId(r.eventId) === id);
      const checkedIn = evRegs.filter(
        (r) => r.status === 'checked_in' || r.status === 'completed'
      ).length;
      const official = evRegs.filter(
        (r) =>
          r.status === 'registered' ||
          r.status === 'checked_in' ||
          r.status === 'completed'
      ).length;
      const waitlist = evRegs.filter((r) => r.status === 'waitlist').length;
      const maxSlots = typeof ev.maxSlots === 'number' && ev.maxSlots > 0 ? ev.maxSlots : 100;
      const quotaRatio = Math.min(100, Math.round((official / maxSlots) * 100));

      let gpsViolations = 0;
      if (ev.coordinates?.latitude != null && ev.coordinates?.longitude != null) {
        const limit = ev.coordinates.radiusMeters || 500;
        for (const r of evRegs) {
          if (
            (r.status === 'checked_in' || r.status === 'completed') &&
            r.checkInMethod !== 'admin_manual' &&
            r.checkInLocation
          ) {
            const dist = getDistanceMeters(
              r.checkInLocation.latitude,
              r.checkInLocation.longitude,
              ev.coordinates.latitude,
              ev.coordinates.longitude
            );
            if (dist > limit) gpsViolations++;
          }
        }
      }

      const startMs = ev.time?.start ? new Date(ev.time.start).getTime() : 0;
      const endMs = ev.time?.end ? new Date(ev.time.end).getTime() : 0;
      const isUpcoming =
        !['completed', 'past', 'cancelled'].includes(ev.status) &&
        (!endMs || endMs > now);

      return {
        id,
        title: ev.title || 'Sự kiện',
        shortTitle:
          (ev.title || 'SK').length > 14
            ? `${(ev.title || 'SK').slice(0, 12)}…`
            : ev.title || 'SK',
        checkedIn,
        official,
        waitlist,
        maxSlots,
        quotaRatio,
        gpsViolations,
        isUpcoming,
        startMs,
        hasGps: ev.coordinates?.latitude != null && ev.coordinates?.longitude != null,
      };
    });
  }, [events, registrations]);

  const filteredColumnEvents = useMemo(() => {
    let list = [...eventMetricsList];
    if (columnFilter === 'upcoming') {
      list = list.filter((item) => item.isUpcoming);
      list.sort((a, b) => (a.startMs || Infinity) - (b.startMs || Infinity));
    } else if (columnFilter === 'attention') {
      list = list
        .filter(
          (item) =>
            item.quotaRatio >= 75 ||
            item.waitlist > 0 ||
            item.gpsViolations > 0 ||
            !item.hasGps
        )
        .sort(
          (a, b) =>
            b.gpsViolations * 10 +
            b.waitlist * 3 +
            b.quotaRatio -
            (a.gpsViolations * 10 + a.waitlist * 3 + a.quotaRatio)
        );
      if (list.length === 0) {
        list = [...eventMetricsList].sort((a, b) => b.quotaRatio - a.quotaRatio);
      }
    } else {
      list.sort((a, b) => b.official + b.waitlist - (a.official + a.waitlist));
    }
    return list.slice(0, 6);
  }, [eventMetricsList, columnFilter]);

  const activeSelectedEvent = useMemo(() => {
    if (filteredColumnEvents.length === 0) return null;
    if (selectedEventId) {
      const match = filteredColumnEvents.find((e) => e.id === selectedEventId);
      if (match) return match;
    }
    return filteredColumnEvents[0];
  }, [filteredColumnEvents, selectedEventId]);

  const maxColumnValue = useMemo(() => {
    let maxVal = 5;
    for (const item of filteredColumnEvents) {
      if (item.official > maxVal) maxVal = item.official;
      if (item.checkedIn > maxVal) maxVal = item.checkedIn;
    }
    return Math.ceil(maxVal * 1.15);
  }, [filteredColumnEvents]);

  // 3. Phân bố sự kiện theo Thể loại
  const categoryStats = useMemo(() => {
    const map = new Map<
      string,
      { category: string; eventCount: number; regCount: number }
    >();
    const regCountByEvent = new Map<string, number>();

    for (const r of registrations) {
      if (r.status === 'cancelled') continue;
      const eid = entityId(r.eventId);
      if (eid) {
        regCountByEvent.set(eid, (regCountByEvent.get(eid) || 0) + 1);
      }
    }

    for (const ev of events) {
      const cat = ev.category?.trim() || 'Khác';
      const eid = entityId(ev);
      const curr = map.get(cat) || { category: cat, eventCount: 0, regCount: 0 };
      curr.eventCount += 1;
      curr.regCount += regCountByEvent.get(eid) || 0;
      map.set(cat, curr);
    }

    const list = Array.from(map.values()).sort((a, b) =>
      categoryMetric === 'registrations'
        ? b.regCount - a.regCount || b.eventCount - a.eventCount
        : b.eventCount - a.eventCount || b.regCount - a.regCount
    );

    const maxMetric = Math.max(
      1,
      ...list.map((c) =>
        categoryMetric === 'registrations' ? c.regCount : c.eventCount
      )
    );

    return { list, maxMetric };
  }, [events, registrations, categoryMetric]);

  // 4. Phân bổ Điểm rèn luyện sinh viên
  const studentPointStats = useMemo(() => {
    const students = users.filter((u) => u.role === 'student');
    let excellent = 0; // >= 90
    let good = 0; // 80 - 89
    let fair = 0; // 65 - 79
    let avg = 0; // < 65
    let totalPoints = 0;

    for (const s of students) {
      const pt = typeof s.point === 'number' ? s.point : 0;
      totalPoints += pt;
      if (pt >= 90) excellent++;
      else if (pt >= 80) good++;
      else if (pt >= 65) fair++;
      else avg++;
    }

    const total = students.length;
    const mean = total > 0 ? (totalPoints / total).toFixed(1) : '0.0';

    const segments = [
      { key: 'excellent', label: 'Xuất sắc (≥90)', count: excellent, color: '#10B981' },
      { key: 'good', label: 'Tốt (80–89)', count: good, color: '#3B82F6' },
      { key: 'fair', label: 'Khá (65–79)', count: fair, color: '#F59E0B' },
      { key: 'avg', label: 'Trung bình (<65)', count: avg, color: '#EF4444' },
    ];

    return { total, mean, segments };
  }, [users]);

  const cardBg = theme.surface;
  const borderCol = theme.border;
  const subSurface = theme.surfaceSecondary;
  const trackColor = isDark ? '#334155' : '#E2E8F0';

  if (loading && events.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {/* ─── CHART 1: Dual Donut Gauges (Check-in & GPS Security) ────────── */}
      <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <View style={styles.chartHeaderRow}>
          <View style={styles.chartTitleGroup}>
            <Ionicons name="pie-chart-outline" size={18} color={theme.primary} />
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
              Hiệu Suất Điểm Danh & GPS
            </Text>
          </View>
          <View style={[styles.livePill, { backgroundColor: isDark ? 'rgba(16,185,129,0.16)' : '#ECFDF5' }]}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>Thời gian thực</Text>
          </View>
        </View>

        <View style={styles.dualGaugeRow}>
          <View style={[styles.gaugeBox, { backgroundColor: subSurface, borderColor: borderCol }]}>
            <RingGauge
              percent={overviewStats.checkInRate}
              activeColor="#10B981"
              trackColor={trackColor}
              innerBgColor={subSurface}
              textColor={theme.textPrimary}
              subTextColor={theme.textSecondary}
              centerSubLabel="Check-in"
            />
            <Text style={[styles.gaugeLabel, { color: theme.textPrimary }]} numberOfLines={2}>
              Tỷ lệ tham dự
            </Text>
            <Text style={[styles.gaugeCaption, { color: theme.textSecondary }]} numberOfLines={2}>
              {overviewStats.checkedIn} / {overviewStats.officialTotal} lượt
            </Text>
          </View>

          <View style={[styles.gaugeBox, { backgroundColor: subSurface, borderColor: borderCol }]}>
            <RingGauge
              percent={overviewStats.gpsCoveragePercent}
              activeColor={overviewStats.gpsViolationCount > 0 ? '#F59E0B' : '#3B82F6'}
              trackColor={trackColor}
              innerBgColor={subSurface}
              textColor={theme.textPrimary}
              subTextColor={theme.textSecondary}
              centerSubLabel={overviewStats.gpsCheckedCount > 0 ? 'GPS chuẩn' : 'Phủ GPS'}
            />
            <Text style={[styles.gaugeLabel, { color: theme.textPrimary }]} numberOfLines={2}>
              {overviewStats.gpsCheckedCount > 0 ? 'Check-in GPS hợp lệ' : 'Sự kiện bật GPS'}
            </Text>
            <Text style={[styles.gaugeCaption, { color: theme.textSecondary }]} numberOfLines={2}>
              {overviewStats.gpsCheckedCount > 0
                ? `${overviewStats.gpsValidCount}/${overviewStats.gpsCheckedCount} (${overviewStats.gpsViolationCount} vi phạm)`
                : `${overviewStats.eventsWithGps}/${events.length} sự kiện`}
            </Text>
          </View>
        </View>

        {/* Status Pill Breakdown */}
        <View style={styles.statusPillsGrid}>
          {[
            { label: 'Đã Check-in', count: overviewStats.checkedIn, color: '#10B981' },
            { label: 'Chờ đến', count: overviewStats.registeredOnly, color: '#3B82F6' },
            { label: 'Waitlist', count: overviewStats.waitlist, color: '#F59E0B' },
            { label: 'Đã hủy', count: overviewStats.cancelled, color: '#EF4444' },
          ].map((pill) => (
            <View
              key={pill.label}
              style={[styles.statusMiniPill, { backgroundColor: subSurface, borderColor: borderCol }]}
            >
              <View style={styles.statusMiniTop}>
                <View style={[styles.colorDot, { backgroundColor: pill.color }]} />
                <Text style={[styles.statusMiniLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                  {pill.label}
                </Text>
              </View>
              <Text style={[styles.statusMiniValue, { color: theme.textPrimary }]}>
                {pill.count}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── CHART 2: Interactive Grouped Column Chart (Đăng ký vs Check-in) ─ */}
      <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <View style={styles.chartHeaderStack}>
          <View style={styles.chartTitleGroup}>
            <Ionicons name="bar-chart-outline" size={18} color="#8B5CF6" />
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
              So Sánh Đăng Ký & Điểm Danh
            </Text>
          </View>
          <Text style={[styles.chartHintText, { color: theme.textTertiary }]}>
            Chạm vào từng cột sự kiện để xem chi tiết
          </Text>
        </View>

        {/* Filter Chips */}
        <View style={styles.segmentRow}>
          {[
            { key: 'top' as ColumnFilterMode, label: '🔥 Top tham gia' },
            { key: 'upcoming' as ColumnFilterMode, label: '📅 Sắp tới' },
            { key: 'attention' as ColumnFilterMode, label: '⚠️ Cần chú ý' },
          ].map((tab) => {
            const active = columnFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.segmentChip,
                  {
                    backgroundColor: active ? theme.primary : subSurface,
                    borderColor: active ? theme.primary : borderCol,
                  },
                ]}
                onPress={() => setColumnFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentChipText,
                    { color: active ? '#FFFFFF' : theme.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#3B82F6' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Đã đăng ký</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Đã Check-in</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Waitlist</Text>
          </View>
        </View>

        {filteredColumnEvents.length === 0 ? (
          <View style={[styles.emptyChartBox, { backgroundColor: subSurface }]}>
            <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>
              Chưa có dữ liệu sự kiện phù hợp để vẽ biểu đồ.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.columnChartArea}>
              {/* Y-Axis Labels */}
              <View style={styles.yAxisColumn}>
                <Text style={[styles.yAxisLabel, { color: theme.textTertiary }]}>
                  {maxColumnValue}
                </Text>
                <Text style={[styles.yAxisLabel, { color: theme.textTertiary }]}>
                  {Math.round(maxColumnValue / 2)}
                </Text>
                <Text style={[styles.yAxisLabel, { color: theme.textTertiary }]}>0</Text>
              </View>

              <View style={styles.barsPlotWrap}>
                {/* Reference horizontal gridlines aligned with barTrack height (124px) */}
                <View pointerEvents="none" style={styles.gridLinesLayer}>
                  <View style={[styles.gridLine, { borderTopColor: borderCol }]} />
                  <View style={[styles.gridLine, { borderTopColor: borderCol }]} />
                  <View style={[styles.gridLine, { borderTopColor: borderCol }]} />
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.barsScrollContent}
                >
                {filteredColumnEvents.map((ev) => {
                  const isSelected = activeSelectedEvent?.id === ev.id;
                  const regBarH = Math.max(
                    ev.official > 0 ? 6 : 2,
                    Math.round((ev.official / maxColumnValue) * 124)
                  );
                  const chkBarH = Math.max(
                    ev.checkedIn > 0 ? 6 : 2,
                    Math.round((ev.checkedIn / maxColumnValue) * 124)
                  );

                  return (
                    <TouchableOpacity
                      key={ev.id}
                      style={[
                        styles.barGroupCard,
                        isSelected && {
                          backgroundColor: isDark ? 'rgba(59,130,246,0.14)' : '#EFF6FF',
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => setSelectedEventId(ev.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.barPairWrap}>
                        {/* Official Bar */}
                        <View style={styles.singleBarCol}>
                          <Text style={[styles.barValueTop, { color: '#3B82F6' }]}>
                            {ev.official}
                          </Text>
                          <View
                            style={[
                              styles.barTrack,
                              { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : '#F1F5F9' },
                            ]}
                          >
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: regBarH,
                                  backgroundColor: '#3B82F6',
                                },
                              ]}
                            />
                          </View>
                        </View>

                        {/* Checked-in Bar */}
                        <View style={styles.singleBarCol}>
                          <Text style={[styles.barValueTop, { color: '#10B981' }]}>
                            {ev.checkedIn}
                          </Text>
                          <View
                            style={[
                              styles.barTrack,
                              { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#F1F5F9' },
                            ]}
                          >
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: chkBarH,
                                  backgroundColor: '#10B981',
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>

                      <Text
                        style={[
                          styles.barEventLabel,
                          { color: isSelected ? theme.primary : theme.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {ev.shortTitle}
                      </Text>

                      {ev.waitlist > 0 && (
                        <View style={styles.waitlistDotBadge}>
                          <Text style={styles.waitlistDotBadgeText}>+{ev.waitlist} chờ</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
                </ScrollView>
              </View>
            </View>

            {/* Selected Event Interactive Insight Card */}
            {activeSelectedEvent && (
              <View style={[styles.insightCard, { backgroundColor: subSurface, borderColor: borderCol }]}>
                <View style={styles.insightHeader}>
                  <Text style={[styles.insightTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                    {activeSelectedEvent.title}
                  </Text>
                  <View
                    style={[
                      styles.quotaPill,
                      {
                        backgroundColor:
                          activeSelectedEvent.quotaRatio >= 90
                            ? 'rgba(239,68,68,0.15)'
                            : activeSelectedEvent.quotaRatio >= 70
                            ? 'rgba(245,158,11,0.15)'
                            : 'rgba(16,185,129,0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.quotaPillText,
                        {
                          color:
                            activeSelectedEvent.quotaRatio >= 90
                              ? '#DC2626'
                              : activeSelectedEvent.quotaRatio >= 70
                              ? '#D97706'
                              : '#059669',
                        },
                      ]}
                    >
                      Quota {activeSelectedEvent.quotaRatio}%
                    </Text>
                  </View>
                </View>

                <Text style={[styles.insightMeta, { color: theme.textSecondary }]}>
                  Chính thức: {activeSelectedEvent.official}/{activeSelectedEvent.maxSlots} • Đã check-in:{' '}
                  {activeSelectedEvent.checkedIn} • Chờ vé: {activeSelectedEvent.waitlist}
                  {activeSelectedEvent.gpsViolations > 0
                    ? ` • ⚠️ ${activeSelectedEvent.gpsViolations} sai vị trí`
                    : ''}
                </Text>

                {/* Quota fill progress bar */}
                <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${activeSelectedEvent.quotaRatio}%`,
                        backgroundColor:
                          activeSelectedEvent.quotaRatio >= 90
                            ? '#EF4444'
                            : activeSelectedEvent.quotaRatio >= 70
                            ? '#F59E0B'
                            : '#3B82F6',
                      },
                    ]}
                  />
                </View>

                <View style={styles.insightActions}>
                  {onSelectEventReport && (
                    <TouchableOpacity
                      style={[styles.insightBtn, { backgroundColor: theme.surface, borderColor: borderCol }]}
                      onPress={() => onSelectEventReport(activeSelectedEvent.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="people-outline" size={14} color={theme.primary} />
                      <Text style={[styles.insightBtnText, { color: theme.primary }]}>
                        Xem danh sách & Quota
                      </Text>
                    </TouchableOpacity>
                  )}
                  {onSelectEventQr && (
                    <TouchableOpacity
                      style={[styles.insightBtn, { backgroundColor: theme.surface, borderColor: borderCol }]}
                      onPress={() =>
                        onSelectEventQr(activeSelectedEvent.id, activeSelectedEvent.title)
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons name="qr-code-outline" size={14} color="#10B981" />
                      <Text style={[styles.insightBtnText, { color: '#10B981' }]}>Chiếu QR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* ─── CHART 3: Category Breakdown Horizontal Bars ──────────────────── */}
      <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <View style={styles.chartHeaderRow}>
          <View style={styles.chartTitleGroup}>
            <Ionicons name="layers-outline" size={18} color="#F59E0B" />
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
              Phân Bố Theo Thể Loại
            </Text>
          </View>

          <View style={[styles.miniToggleWrap, { backgroundColor: subSurface, borderColor: borderCol }]}>
            <TouchableOpacity
              style={[
                styles.miniToggleBtn,
                categoryMetric === 'registrations' && { backgroundColor: theme.primary },
              ]}
              onPress={() => setCategoryMetric('registrations')}
            >
              <Text
                style={[
                  styles.miniToggleText,
                  { color: categoryMetric === 'registrations' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Lượt ĐK
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.miniToggleBtn,
                categoryMetric === 'events' && { backgroundColor: theme.primary },
              ]}
              onPress={() => setCategoryMetric('events')}
            >
              <Text
                style={[
                  styles.miniToggleText,
                  { color: categoryMetric === 'events' ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                Sự kiện
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {categoryStats.list.length === 0 ? (
          <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>
            Chưa có dữ liệu thể loại sự kiện.
          </Text>
        ) : (
          <View style={styles.horizontalBarsList}>
            {categoryStats.list.map((cat, idx) => {
              const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              const value =
                categoryMetric === 'registrations' ? cat.regCount : cat.eventCount;
              const widthPercent = Math.max(
                value > 0 ? 8 : 3,
                Math.round((value / categoryStats.maxMetric) * 100)
              );

              return (
                <View key={cat.category} style={styles.horizontalBarItem}>
                  <View style={styles.horizontalBarTopRow}>
                    <View style={styles.categoryLabelWrap}>
                      <View style={[styles.colorDot, { backgroundColor: color }]} />
                      <Text style={[styles.horizontalBarLabel, { color: theme.textPrimary }]}>
                        {cat.category}
                      </Text>
                    </View>
                    <Text style={[styles.horizontalBarValue, { color: theme.textSecondary }]}>
                      {cat.regCount} lượt ĐK • {cat.eventCount} sự kiện
                    </Text>
                  </View>
                  <View style={[styles.horizontalTrack, { backgroundColor: trackColor }]}>
                    <View
                      style={[
                        styles.horizontalFill,
                        { width: `${widthPercent}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* ─── CHART 4: Student Training Points (ĐRL) Stacked Bar ───────────── */}
      <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <View style={styles.chartHeaderRow}>
          <View style={styles.chartTitleGroup}>
            <Ionicons name="ribbon-outline" size={18} color="#10B981" />
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>
              Phân Bổ Điểm Rèn Luyện (ĐRL)
            </Text>
          </View>
          <View style={[styles.avgPill, { backgroundColor: isDark ? 'rgba(59,130,246,0.18)' : '#EFF6FF' }]}>
            <Text style={[styles.avgPillText, { color: theme.primary }]}>
              TB: {studentPointStats.mean}đ
            </Text>
          </View>
        </View>

        <Text style={[styles.chartHintText, { color: theme.textSecondary, marginBottom: 10 }]}>
          Thống kê trên {studentPointStats.total} tài khoản sinh viên toàn trường
        </Text>

        {/* Stacked Proportional Segment Bar */}
        <View style={[styles.stackedBar, { backgroundColor: trackColor }]}>
          {studentPointStats.segments.map((seg) => {
            if (seg.count === 0) return null;
            return (
              <View
                key={seg.key}
                style={{
                  flex: seg.count,
                  height: '100%',
                  backgroundColor: seg.color,
                }}
              />
            );
          })}
        </View>

        <View style={styles.drlLegendGrid}>
          {studentPointStats.segments.map((seg) => {
            const pct =
              studentPointStats.total > 0
                ? Math.round((seg.count / studentPointStats.total) * 100)
                : 0;
            return (
              <View
                key={seg.key}
                style={[styles.drlLegendCard, { backgroundColor: subSurface, borderColor: borderCol }]}
              >
                <View style={styles.drlLegendTop}>
                  <View style={[styles.colorDot, { backgroundColor: seg.color }]} />
                  <Text style={[styles.drlLegendTitle, { color: theme.textSecondary }]} numberOfLines={1}>
                    {seg.label}
                  </Text>
                </View>
                <Text style={[styles.drlLegendVal, { color: theme.textPrimary }]}>
                  {seg.count} SV ({pct}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
    marginBottom: 18,
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chartHeaderStack: {
    marginBottom: 10,
  },
  chartTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  chartHintText: {
    fontSize: 11.5,
    marginTop: 2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  livePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  dualGaugeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  gaugeBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  gaugeLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  gaugeCaption: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  statusPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusMiniPill: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusMiniTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusMiniLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  statusMiniValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  segmentChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  segmentChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  columnChartArea: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 4,
  },
  yAxisColumn: {
    width: 28,
    height: 156,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
    paddingTop: 20,
  },
  yAxisLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  barsPlotWrap: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  gridLinesLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 26,
    height: 124,
    justifyContent: 'space-between',
  },
  gridLine: {
    width: '100%',
    borderTopWidth: StyleSheet.hairlineWidth,
    opacity: 0.7,
  },
  barsScrollContent: {
    gap: 8,
    paddingRight: 6,
  },
  barGroupCard: {
    width: 78,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  barPairWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    height: 142,
  },
  singleBarCol: {
    alignItems: 'center',
  },
  barValueTop: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 3,
  },
  barTrack: {
    width: 18,
    height: 124,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barEventLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 13,
  },
  waitlistDotBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(245,158,11,0.16)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  waitlistDotBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  emptyChartBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  insightCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  insightTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  quotaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  quotaPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  insightMeta: {
    fontSize: 11.5,
    lineHeight: 17,
    marginBottom: 8,
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  insightActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  insightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  insightBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  miniToggleWrap: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  miniToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  horizontalBarsList: {
    gap: 10,
  },
  horizontalBarItem: {
    gap: 5,
  },
  horizontalBarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 110,
  },
  horizontalBarLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  horizontalBarValue: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 0,
  },
  horizontalTrack: {
    height: 9,
    borderRadius: 999,
    overflow: 'hidden',
  },
  horizontalFill: {
    height: '100%',
    borderRadius: 999,
  },
  avgPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  avgPillText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  stackedBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 999,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 12,
  },
  drlLegendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  drlLegendCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  drlLegendTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drlLegendTitle: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  drlLegendVal: {
    fontSize: 12.5,
    fontWeight: '800',
    marginTop: 3,
  },
});
