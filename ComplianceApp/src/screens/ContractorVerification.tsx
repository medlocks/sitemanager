import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  SectionList,
  Alert,
} from "react-native";
import { contractorService, Contractor } from "../services/contractorService";
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, TOUCH_TARGETS } from "../theme";

export const ContractorVerification = ({ navigation }: any) => {
  const [allContractors, setAllContractors] = useState<Contractor[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadContractors = async () => {
    try {
      setLoading(true);
      const data = await contractorService.getAllContractors();
      setAllContractors(data);
      formatSections(data, searchQuery);
    } catch (e: any) {
      Alert.alert("Sync Error", "Failed to load workforce data: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatSections = (data: Contractor[], query: string) => {
    const q = query.toLowerCase();
    const filtered = data.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.specialism?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q),
    );

    const sections = [
      {
        title: "Awaiting Verification",
        data: filtered.filter(
          (c) => c.competence_status === "Pending" && c.competence_evidence_url,
        ),
      },
      {
        title: "Approved Specialists",
        data: filtered.filter((c) => c.competence_status === "Approved"),
      },
      {
        title: "Suspended / Others",
        data: filtered.filter(
          (c) =>
            c.competence_status !== "Approved" &&
            c.competence_status !== "Pending",
        ),
      },
    ];
    setFilteredSections(sections.filter((s) => s.data.length > 0));
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadContractors);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    formatSections(allContractors, searchQuery);
  }, [searchQuery, allContractors]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle} accessibilityRole="header">
          Specialist Verification
        </Text>
        <TextInput
          style={styles.searchBar}
          placeholder="Search by name, trade, or company..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={!loading}
          accessibilityLabel="Search contractors"
          accessibilityHint="Filters contractors by name, trade, or company"
        />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            accessibilityLabel="Loading workforce data"
          />
        </View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate("ContractorDetail", { contractor: item })
              }
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${item.specialism || "General"} Specialist. Status: ${item.competence_status}`}
              accessibilityHint="Opens detailed competence dossier"
            >
              <View style={styles.infoBox}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>
                  {item.specialism || "General"} Specialist
                </Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader} accessibilityRole="header">
              {title}
            </Text>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText} accessibilityRole="text">
              No contractors match your search or require verification.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: SPACING.l,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.lightGray,
  },
  mainTitle: {
    ...TYPOGRAPHY.header,
    color: COLORS.primary,
  },
  searchBar: {
    backgroundColor: COLORS.background,
    minHeight: TOUCH_TARGETS.min,
    paddingHorizontal: SPACING.m,
    borderRadius: 12,
    marginTop: SPACING.m,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    ...TYPOGRAPHY.caption,
    fontWeight: "900",
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.s,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    minHeight: 80,
    padding: SPACING.m,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.s,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  infoBox: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.subheader,
    color: COLORS.primary,
  },
  sub: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  chevron: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900",
    marginLeft: SPACING.s,
  },
  emptyText: {
    textAlign: "center",
    ...TYPOGRAPHY.body,
    marginTop: 60,
    color: COLORS.textLight,
  },
});
