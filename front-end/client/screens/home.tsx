import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import netflixLogo from "../assets/images/netflix.png";
import appleLogo from "../assets/images/apple.png";
import hotstarLogo from "../assets/images/hotstar.png";

interface ServiceOptionProps {
  title: string;
  onPress: () => void;
}

const ServiceOption: React.FC<ServiceOptionProps> = ({ title, onPress }) => (
  <TouchableOpacity style={styles.serviceOption} onPress={onPress}>
    <Text style={styles.serviceOptionText}>{title}</Text>
    <Ionicons name="chevron-forward" size={20} color="#888" />
  </TouchableOpacity>
);

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.phoneNumber}>70XXX-XXX01</Text>
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
                ⚠️ This application is currently in its prototype stage and is
                intended solely for demonstration and testing purposes. Some
                features may be incomplete, under development, or simulated. The
                services and functionalities you see here, such as recharge
                options, and media subscriptions, are not connected to real
                telecom networks or service providers at this time.
                {"\n\n"}
                Please note that no actual transactions or service activations
                will occur through this app. Any data or interaction you perform
                here will remain local and used only to showcase the design and
                flow of the final product.
                {"\n\n"}
                We are actively working to improve the user experience and build
                out the full functionality. Your feedback and support are
                greatly appreciated.
                {"\n\n"}
                Thank you for exploring the prototype!
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

        <View style={styles.notificationContainer}>
          <Ionicons name="alert-circle" size={16} color="#FF3B30" />
          <Text style={styles.notificationText}>5 new notification</Text>
        </View>

        <View style={styles.serviceOptions}>
          <ServiceOption
            title="virtual numbers"
            onPress={() => router.push("/virtual-number-call")}
          />
          <ServiceOption title="recharge" onPress={() => {}} />
          <ServiceOption title="data add ons" onPress={() => {}} />
          <ServiceOption title="SMS packs" onPress={() => {}} />
        </View>
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
  phoneNumber: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    backgroundColor: "#64B5F6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  },
  statusBadge: {
    backgroundColor: "#4CD964",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  benefitsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  benefitsTitle: {
    fontSize: 14,
    color: "black",
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
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  deactivateText: {
    color: "#fff",
    fontWeight: "600",
  },
  detailsButton: {
    backgroundColor: "#64B5F6",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  detailsText: {
    color: "#fff",
    fontWeight: "600",
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
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  notificationText: {
    color: "#FF3B30",
    fontSize: 14,
    marginLeft: 4,
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
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HomeScreen;
