import React from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    Instagram,
    Twitter,
    Facebook,
    Youtube,
} from "lucide-react-native";

export default function Footer() {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={{ paddingBottom: insets.bottom }}
            className="bg-netsa-footer p-8"
        >

            {/* -------- BRAND + DESCRIPTION -------- */}
            <View>
                <Text className="text-netsa-text-primary text-2xl font-semibold font-satoshi-bold">Netsa</Text>
                <Text className="text-netsa-text-secondary mt-3 leading-5 font-inter">
                    Connecting the performing arts community through events,
                    networking, and creative collaboration.
                </Text>

                {/* Social Row */}
                <View className="flex-row gap-4 w-full mt-5">
                    <Instagram size={20} color="#fff" />
                    <Twitter size={20} color="#fff" />
                    <Facebook size={20} color="#fff" />
                    <Youtube size={20} color="#fff" />
                </View>
            </View>

            {/* ---------- NAVIGATION SECTIONS ---------- */}
            <View className="flex-row flex-wrap mt-10">

                {/* Platform */}
                <View className="w-1/2 mb-6">
                    <Text className="text-netsa-text-primary font-semibold mb-3 font-satoshi-medium">Platform</Text>
                    <FooterLink href="/events" label="Events" />
                    <FooterLink href="/community" label="Community" />
                    <FooterLink href="/workshops" label="Workshops" />
                    <FooterLink href="/gigs" label="Gigs" />
                    <FooterLink href="/artists" label="Artists" />
                </View>

                {/* Support */}
                <View className="w-1/2 mb-6">
                    <Text className="text-netsa-text-primary font-semibold mb-3 font-satoshi-medium">Support</Text>
                    <FooterLink href="/help" label="Help Center" />
                    <FooterLink href="/contact" label="Contact Us" />
                    <FooterLink href="/safety" label="Safety" />
                    <FooterLink href="/guidelines" label="Guidelines" />
                    <FooterLink href="/faq" label="FAQ" />
                </View>

                {/* Company */}
                <View className="w-1/2 mb-6">
                    <Text className="text-netsa-text-primary font-semibold mb-3 font-satoshi-medium">Company</Text>
                    <FooterLink href="/about" label="About Us" />
                    <FooterLink href="/careers" label="Careers" />
                    <FooterLink href="/press" label="Press" />
                    <FooterLink href="/partners" label="Partners" />
                    <FooterLink href="/blog" label="Blog" />
                </View>

                {/* Legal */}
                <View className="w-1/2 mb-6">
                    <Text className="text-netsa-text-primary font-semibold mb-3 font-satoshi-medium">Legal</Text>
                    <FooterLink href="/privacy" label="Privacy Policy" />
                    <FooterLink href="/terms" label="Terms of Service" />
                    <FooterLink href="/cookies" label="Cookie Policy" />
                    <FooterLink href="/disclaimer" label="Disclaimer" />
                </View>
            </View>

            {/* ---------- STAY IN THE LOOP SECTION ---------- */}
            <View className="mt-6">
                <Text className="text-netsa-text-primary font-semibold text-lg font-satoshi-bold">Stay in the Loop</Text>
                <Text className="text-netsa-text-secondary mt-2 font-inter">
                    Get the latest events and community updates.
                </Text>

                <View className="flex-row items-center mt-4">
                    <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor="#9A9AA3"
                        className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-white font-inter"
                    />

                    <Pressable className="bg-netsa-accent-red px-5 py-3 rounded-lg ml-3">
                        <Text className="text-white font-medium font-satoshi-medium">Subscribe</Text>
                    </Pressable>
                </View>
            </View>


            {/* ---------- BOTTOM COPYRIGHT ROW ---------- */}
            <View className="border-t border-white/10 mt-8 pt-6 flex-row justify-between">
                <Text className="text-netsa-text-muted text-xs font-inter">
                    © 2025 Netsa. All rights reserved.
                </Text>
                {/* <Text className="text-netsa-text-muted text-xs font-inter">
                    Made with ❤️ for the performing arts community
                </Text> */}
            </View>
        </View>
    );
}

function FooterLink({ href, label }: { href: string; label: string }) {
    return (
        <Link href={href}>
            <Text className="text-gray-400 mb-2">
                {label}
            </Text>
        </Link>
    );
}
