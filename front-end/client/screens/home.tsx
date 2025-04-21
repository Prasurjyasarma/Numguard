import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import netflixLogo from "../assets/images/netflix.png";
import appleLogo from "../assets/images/apple.png";
import hotstarLogo from "../assets/images/hotstar.png";
import data from "../data.json";
import api from "../api";

interface ServiceOptionProps {
  title: string;
  onPress: () => void;
  icon: React.ReactNode;
}

interface Notification {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
  category: string;
  tag: string;
  is_read: boolean;
}

interface CategoryUnreadCounts {
  [key: string]: number;
}

const ServiceOption: React.FC<ServiceOptionProps> = ({ title, onPress, icon }) => (
  <TouchableOpacity style={styles.serviceOption} onPress={onPress}>
    <View style={styles.serviceOptionContent}>
      {icon}
      <Text style={styles.serviceOptionText}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={22} color="#000" />
  </TouchableOpacity>
);

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [categoryUnreadCounts, setCategoryUnreadCounts] =
    useState<CategoryUnreadCounts>({});
  const [physicalNumber, setPhysicalNumber] = useState<string>("");
  const [notificationCount, setNotificationCount] = useState<number>(0);

  // Use Platform-specific container
  const Container = Platform.OS === 'ios' ? SafeAreaView : View;

  // Fetch physical number
  useEffect(() => {
    const fetchPhysicalNumber = async () => {
      try {
        const response = await api.get("/physical-numbers/");
        const number = response.data[0]?.number || "";
        setPhysicalNumber(number);
      } catch (error) {
        console.error("Error fetching physical number:", error);
      }
    };

    fetchPhysicalNumber();
  }, []);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const response = await api.get("/total-notification/");
        const count = response.data?.total_notification || 0;
        setNotificationCount(count);
      } catch (error) {
        console.error("Error fetching notification count:", error);
        setNotificationCount(0);
      }
    };

    fetchNotificationCount();
  }, []);

  useEffect(() => {
    const notifications = data as Notification[];

    const unreadCount = notifications.filter((item) => !item.is_read).length;
    setTotalUnread(unreadCount);

    const categoryCounts: CategoryUnreadCounts = {};

    notifications.forEach((notification) => {
      if (!notification.is_read) {
        const category = notification.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    setCategoryUnreadCounts(categoryCounts);
  }, []);

  return (
    <Container style={[styles.safeArea, Platform.OS === 'android' && styles.androidSafeArea]}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.phoneNumber}>
            {physicalNumber ? maskNumber(physicalNumber) : "Loading..."}
          </Text>
          <Text style={styles.prepaidLabel}>(prepaid)</Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="help-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Modal for Help Info */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Prototype Notice</Text>
              <Text style={styles.modalText}>
                ⚠️ This application is currently in its prototype stage...
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeaderRow}>
            <Text style={styles.planName}>₹3,000 Unlimited</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>active</Text>
            </View>
          </View>

          <View style={styles.planDetailsContainer}>
            <View style={styles.planDetail}>
              <Text style={styles.detailTitle}>Data</Text>
              <Text style={styles.detailValue}>2 GB/day</Text>
            </View>
            <View style={styles.planDetail}>
              <Text style={styles.detailTitle}>Calls</Text>
              <Text style={styles.detailValue}>Unlimited</Text>
            </View>
            <View style={styles.planDetail}>
              <Text style={styles.detailTitle}>Valid Till</Text>
              <Text style={styles.detailValue}>4 May 2026</Text>
            </View>
          </View>

          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Benefits</Text>
            <View style={styles.benefitsIcons}>
              <View style={styles.benefitIcon}>
                <Image source={netflixLogo} style={styles.benefitImage} />
              </View>
              <View style={styles.benefitIcon}>
                <Image source={appleLogo} style={styles.benefitImage} />
              </View>
              <View style={styles.benefitIcon}>
                <Image source={hotstarLogo} style={styles.benefitImage} />
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.deactivateButton}>
              <Text style={styles.deactivateText}>deactivate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.detailsButton}>
              <Text style={styles.detailsText}>details</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>services</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Notification Container - Only show if count > 0 */}
        {notificationCount > 0 && (
          <View style={styles.notificationContainer}>
            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
            <Text style={styles.notificationText}>
              {notificationCount} new notification{notificationCount !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        <View style={styles.serviceOptions}>
          <ServiceOption
            title="Virtual numbers"
            onPress={() => router.push("/virtual-number-call")}
            icon={<Ionicons name="phone-portrait-outline" size={20} color="#4CAF50" style={styles.serviceIcon} />}
          />
          <ServiceOption
            title="Recharge"
            onPress={() => {}}
            icon={<Ionicons name="wallet-outline" size={20} color="#FF9800" style={styles.serviceIcon} />}
          />
          <ServiceOption
            title="Data add ons"
            onPress={() => {}}
            icon={<Ionicons name="cellular-outline" size={20} color="#2196F3" style={styles.serviceIcon} />}
          />
          <ServiceOption
            title="SMS packs"
            onPress={() => {}}
            icon={<Ionicons name="chatbubble-outline" size={20} color="#9C27B0" style={styles.serviceIcon} />}
          />
        </View>
      </ScrollView>
    </Container>
  );
};

// Helper function to mask number
const maskNumber = (number: string) => {
  if (number.length === 10) {
    return `${number.slice(0, 2)}XXX-XXX${number.slice(7)}`;
  }
  return number;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  androidSafeArea: {
    paddingTop: Platform.OS === 'android' ? 30 : 0
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 8,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 6,
    color: "#333",
  },
  prepaidLabel: {
    fontSize: 16,
    color: "#666",
    marginLeft: 4,
  },
  helpButton: {
    marginLeft: "auto",
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  modalText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  planCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  statusBadge: {
    backgroundColor: "#4CAF50",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  planDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  planDetail: {
    alignItems: "center",
    flex: 1,
  },
  detailTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  benefitsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  benefitsTitle: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    marginBottom: 8,
  },
  benefitsIcons: {
    flexDirection: "row",
    marginTop: 4,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  deactivateButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 7,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deactivateText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  detailsButton: {
    backgroundColor: "#28A745",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 7,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginLeft: 16,
  },
  notificationText: {
    color: "#D32F2F",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  serviceOptions: {
    marginHorizontal: 16,
  },
  serviceOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  serviceIcon: {
    marginRight: 12,
  },
});

export default HomeScreen;