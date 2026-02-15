import React from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { COLORS, TYPOGRAPHY, SPACING, TOUCH_TARGETS } from "../../theme";

const screenWidth = Dimensions.get("window").width;

interface Props {
  incidentData: any;
  accidentData: any;
}

export const AuditCharts = ({ incidentData, accidentData }: Props) => {
  return (
    <ScrollView
      style={styles.container}
      testID="audit-analytics-view"
      accessibilityLabel="Audit Analytics Charts"
    >
      <Text
        style={styles.sectionTitle}
        testID="incident-volume"
        accessibilityRole="header"
      >
        Incident Volume (Faults/Hazards)
      </Text>
      <View
        accessible={true}
        accessibilityLabel={`Bar chart showing incident volume. Data points: ${incidentData.labels.join(", ")}`}
      >
        <BarChart
          data={{
            labels: incidentData.labels,
            datasets: [{ data: incidentData.values }],
          }}
          width={screenWidth - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          style={styles.chartStyle}
          fromZero
          flatColor={true}
          withInnerLines={true}
        />
      </View>

      <View style={styles.spacer}>
        <Text
          style={[styles.sectionTitle, styles.accidentTitle]}
          testID="accident-volume"
          accessibilityRole="header"
        >
          Accident Volume (HSE Logbook)
        </Text>
        <View
          accessible={true}
          accessibilityLabel={`Bar chart showing accident volume. Data points: ${accidentData.labels.join(", ")}`}
        >
          <BarChart
            data={{
              labels: accidentData.labels,
              datasets: [{ data: accidentData.values }],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={accidentChartConfig}
            style={styles.chartStyle}
            fromZero
            flatColor={true}
            withInnerLines={true}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const chartConfig = {
  backgroundColor: COLORS.white,
  backgroundGradientFrom: COLORS.white,
  backgroundGradientTo: COLORS.white,
  decimalPlaces: 0,
  color: () => COLORS.primary,
  labelColor: () => COLORS.text,
  barPercentage: 0.7,
  propsForLabels: {
    fontSize: 14,
    fontWeight: "700",
  },
};

const accidentChartConfig = {
  ...chartConfig,
  color: () => COLORS.secondary,
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.l,
  },
  sectionTitle: {
    ...TYPOGRAPHY.subheader,
    marginBottom: SPACING.s,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    minHeight: TOUCH_TARGETS.min / 2,
  },
  accidentTitle: {
    color: COLORS.secondary,
  },
  chartStyle: {
    borderRadius: 16,
    marginVertical: SPACING.s,
  },
  spacer: {
    marginTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
});
