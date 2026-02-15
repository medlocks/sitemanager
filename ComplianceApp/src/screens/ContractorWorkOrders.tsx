import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Alert,
  SafeAreaView,
  View,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { workOrderService } from "../services/workOrderService";
import { COLORS } from "../theme";

import { QuickActions } from "../components/contractor/QuickActions";
import { WorkOrderList } from "../components/contractor/WorkOrderList";
import { SignOffModal } from "../components/contractor/SignOffModal";

export const ContractorWorkOrders = ({ navigation }: any) => {
  const { user } = useAuth();
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const tasks = await workOrderService.getAssignedTasks(user.id);
      setAssignedTasks(tasks);
    } catch (e: any) {
      Alert.alert("System Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadTasks);
    return unsubscribe;
  }, [navigation, user]);

  const handleSignOffPress = (task: any) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const handleModalSuccess = () => {
    setModalVisible(false);
    setSelectedTask(null);
    loadTasks();
  };

  return (
    <SafeAreaView style={styles.container} testID="contractor-portal-view">
      <QuickActions navigation={navigation} />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            accessibilityLabel="Loading work orders"
          />
        </View>
      ) : (
        <WorkOrderList tasks={assignedTasks} onSignOff={handleSignOffPress} />
      )}

      <SignOffModal
        visible={modalVisible}
        task={selectedTask}
        onClose={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
