import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import data from "../data.json";

interface Notification {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
  category: string;
  tag: string;
  is_read: boolean;
}

const VirtualNumberDashboard: React.FC = () => {
  const router = useRouter();

  const getUnreadCount = (category: string): number => {
    return (data as Notification[]).filter(
      (notification) =>
        notification.category === category && !notification.is_read
    ).length;
  };

  const ecommerceUnreadCount = getUnreadCount("e-commerce");
  const socialMediaUnreadCount = getUnreadCount("social media");

  const copyToClipboard = (number: string): void => {
    Clipboard.setString(number);
    Alert.alert("Copied", `${number} copied to clipboard`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Virtual numbers</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Total virtual number</Text>
            <Text style={styles.summaryCount}>3</Text>
            <View style={styles.tagContainer}>
              <Text style={styles.summaryTag}>e-commerce</Text>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard("9834710256")}
              style={styles.copyableNumber}
            >
              <Text style={styles.summaryNumber}>9834710256</Text>
              <Ionicons
                name="copy-outline"
                size={14}
                color="#666"
                style={styles.copyIcon}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Total available numbers</Text>
            <Text style={styles.summaryCount}>1</Text>
            <View style={styles.tagContainer}>
              <Text style={styles.summaryTag}>social-media</Text>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard("7650923814")}
              style={styles.copyableNumber}
            >
              <Text style={styles.summaryNumber}>7650923814</Text>
              <Ionicons
                name="copy-outline"
                size={14}
                color="#666"
                style={styles.copyIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Request Button */}
        <TouchableOpacity style={styles.requestButton}>
          <Text style={styles.requestText}>request</Text>
        </TouchableOpacity>

        {/* Manage Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>manage</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* E-commerce Manage Card */}
        <TouchableOpacity
          onPress={() => router.push("/e-commerce")}
          style={styles.manageCard}
        >
          <View>
            {ecommerceUnreadCount > 0 && (
              <View style={styles.notificationContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.notificationText}>
                  {ecommerceUnreadCount} new notifications
                </Text>
              </View>
            )}
            <Text style={styles.manageTitle}>e-commerce</Text>
            <Text style={styles.manageNumber}>(9834710256)</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#000" />
        </TouchableOpacity>

        {/* Social Media Manage Card */}
        <TouchableOpacity
          onPress={() => router.push("/social")}
          style={styles.manageCard}
        >
          <View>
            {socialMediaUnreadCount > 0 && (
              <View style={styles.notificationContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.notificationText}>
                  {socialMediaUnreadCount} new notifications
                </Text>
              </View>
            )}
            <Text style={styles.manageTitle}>social-media</Text>
            <Text style={styles.manageNumber}>(7650923814)</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#000" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  helpButton: {
    padding: 8,
  },
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryBox: {
    width: "45%",
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 4,
    marginBottom: 20,
  },
  tagContainer: {
    marginBottom: 8,
  },
  summaryTag: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1c9b7c",
  },
  copyableNumber: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  copyIcon: {
    marginLeft: 4,
  },
  requestButton: {
    backgroundColor: "#64B5F6",
    marginHorizontal: 100,
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  requestText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
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
    backgroundColor: "#ddd",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationText: {
    color: "#FF3B30",
    fontSize: 14,
    marginLeft: 4,
  },
  manageCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  manageTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  manageNumber: {
    fontSize: 14,
    color: "#666",
  },
});

export default VirtualNumberDashboard;
