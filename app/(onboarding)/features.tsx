import { useRouter } from 'expo-router';
import { useTranslation } from '../../src/hooks/useTranslation';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';


export default function Features() {
  const router = useRouter();
  const t = useTranslation();

  function handleStart() {
    router.push('/(onboarding)/privacy');
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.orb, {
        width: 140,
        height: 140,
        backgroundColor: '#C4E8F0',
        opacity: 0.25,
        top: -20,
        right: -20,
      }]} />
      <View style={[styles.orb, {
        width: 85,
        height: 85,
        backgroundColor: '#B8D4B0',
        opacity: 0.25,
        bottom: 24,
        left: -12,
      }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Svg width={132} height={102} viewBox="0 0 56 44">
            <Defs>
              <ClipPath id="ec1">
                <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
              </ClipPath>
            </Defs>
            <Ellipse cx="28" cy="22" rx="20" ry="13" fill="none" stroke="#C4A8D4" strokeWidth="0.4" opacity="0.5" />
            <Ellipse cx="28" cy="22" rx="17" ry="11" fill="none" stroke="#9B72C8" strokeWidth="0.3" opacity="0.3" />
            <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" fill="#FAF6F0" />
            <Circle cx="28" cy="22" r="10.5" fill="#DDD0F8" clipPath="url(#ec1)" />
            <Circle cx="28" cy="22" r="8" fill="#9B72C8" opacity="0.75" clipPath="url(#ec1)" />
            <Circle cx="28" cy="22" r="5.8" fill="#6B3FA0" opacity="0.9" clipPath="url(#ec1)" />
            <Circle cx="28" cy="22" r="3" fill="#1A0E30" clipPath="url(#ec1)" />
            <Circle cx="30.5" cy="19.5" r="1.3" fill="white" opacity="0.9" clipPath="url(#ec1)" />
            <Circle cx="25.5" cy="23.5" r="0.6" fill="white" opacity="0.5" clipPath="url(#ec1)" />
            <Circle cx="28" cy="15.5" r="1.8" fill="#EAC870" clipPath="url(#ec1)" />
            <Circle cx="28" cy="15.5" r="0.8" fill="#C89A30" clipPath="url(#ec1)" />
            <Path d="M8 22 Q28 6 48 22" fill="none" stroke="#3A2850" strokeWidth="1.4" strokeLinecap="round" />
            <Path d="M8 22 Q28 38 48 22" fill="none" stroke="#3A2850" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
            <Circle cx="8" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
            <Circle cx="48" cy="22" r="1" fill="#C4A8D4" opacity="0.6" />
          </Svg>

          <Text style={styles.title}>{t.features.titre}</Text>
          <Text style={styles.subtitle}>{t.features.sousTitre}</Text>
          <Text style={styles.purpleText}>{t.features.texteViolet}</Text>
        </View>

        <View style={styles.progressBlock}>
          <Text style={styles.progressLabel}>{t.features.etape}</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: '#E8D4F8' }]} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.features.cartes.ouverture.titre}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardText}>{t.features.cartes.ouverture.texte}</Text>
              <View style={styles.badgePurple}>
                <Text style={styles.badgePurpleText}>+10 pts</Text>
              </View>
            </View>
            <Text style={[styles.cardNote, { color: '#6B3FA0' }]}>{t.features.cartes.ouverture.note}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: '#DDD0F8' }]} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.features.cartes.affirmation.titre}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardText}>{t.features.cartes.affirmation.texte}</Text>
              <View style={styles.badgeGold}>
                <Text style={styles.badgeGoldText}>+15 pts</Text>
              </View>
            </View>
            <Text style={[styles.cardNote, { color: '#6B3FA0' }]}>{t.features.cartes.affirmation.note}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: '#C8E8C0' }]} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.features.cartes.actions.titre}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardText}>{t.features.cartes.actions.facile}</Text>
              <View style={styles.badgeGreen}>
                <Text style={styles.badgeGreenText}>+15 pts</Text>
              </View>
              <Text style={styles.cardText}>{t.features.cartes.actions.difficile}</Text>
              <View style={styles.badgeGold}>
                <Text style={styles.badgeGoldText}>+25 pts</Text>
              </View>
            </View>
            <Text style={[styles.cardNote, { color: '#3A6A20' }]}>{t.features.cartes.actions.note}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: '#C4E8F0' }]} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.features.cartes.visualisation.titre}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardText}>{t.features.cartes.visualisation.texte}</Text>
              <View style={styles.badgeGold}>
                <Text style={styles.badgeGoldText}>+15 pts</Text>
              </View>
            </View>
            <Text style={[styles.cardNote, { color: '#1A6A80' }]}>{t.features.cartes.visualisation.note}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: '#C4E8F0' }]} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.features.cartes.visionBoard.titre}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardText}>{t.features.cartes.visionBoard.texte}</Text>
              <View style={styles.badgeBlue}>
                <Text style={styles.badgeBlueText}>+5 pts</Text>
              </View>
            </View>
            <Text style={[styles.cardNote, { color: '#1A6A80' }]}>{t.features.cartes.visionBoard.note}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: '#C8E8C0' }]} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.features.cartes.journal.titre}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardText}>{t.features.cartes.journal.texte}</Text>
              <View style={styles.badgeGreen}>
                <Text style={styles.badgeGreenText}>+15 pts</Text>
              </View>
            </View>
            <Text style={[styles.cardNote, { color: '#3A6A20' }]}>{t.features.cartes.journal.note}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: '#FDE8B0' }]} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{t.features.cartes.badges.titre}</Text>
            <Text style={styles.cardText}>{t.features.cartes.badges.texte}</Text>
            <Text style={[styles.cardNote, { color: '#9A6A00' }]}>{t.features.cartes.badges.note}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomBlock}>
        <Pressable style={styles.btnPrimary} onPress={handleStart}>
          <Text style={styles.btnPrimaryText}>{t.features.suivant}</Text>
        </Pressable>
        <View style={styles.dotsNav}>
          <View style={styles.dotNav} />
          <View style={[styles.dotNav, styles.dotNavOn]} />
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0EAE0',
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  content: {
    width: '100%',
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 26,
    fontStyle: 'italic',
    color: '#2A2520',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Jost',
    fontSize: 14,
    fontWeight: '300',
    color: '#7A7068',
    textAlign: 'center',
  },
  purpleText: {
    fontFamily: 'serif',
    fontSize: 17,
    fontStyle: 'italic',
    color: '#6B3FA0',
    textAlign: 'center',
  },
  progressBlock: {
    width: '100%',
    gap: 6,
  },
  progressLabel: {
    fontFamily: 'Jost',
    fontSize: 13,
    color: '#9B80B8',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(196,168,212,0.25)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    width: '33%',
    height: '100%',
    backgroundColor: '#6B3FA0',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontFamily: 'Jost',
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2520',
  },
  cardText: {
    fontFamily: 'Jost',
    fontSize: 13,
    fontWeight: '300',
    color: '#7A7068',
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  badgeGold: {
    backgroundColor: '#FDE8B0',
    borderRadius: 8,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  badgeGoldText: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#9A6A00',
  },
  badgeGreen: {
    backgroundColor: '#C8E8C0',
    borderRadius: 8,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  badgeGreenText: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#2A6A20',
  },
  badgePurple: {
    backgroundColor: '#DDD0F8',
    borderRadius: 8,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  badgePurpleText: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#6B3FA0',
  },
  badgeBlue: {
    backgroundColor: '#C4E8F0',
    borderRadius: 8,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  badgeBlueText: {
    fontFamily: 'Jost',
    fontSize: 11,
    color: '#1A6A80',
  },
  cardNote: {
    fontFamily: 'serif',
    fontSize: 14,
    fontStyle: 'italic',
  },
  bottomBlock: {
    width: '100%',
    gap: 16,
  },
  btnPrimary: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: '#3A3530',
    alignItems: 'center',
    marginTop: 24,
  },
  btnPrimaryText: {
    color: '#F0EAE0',
    fontSize: 19,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dotsNav: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotNav: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#C4A8D4',
  },
  dotNavOn: {
    width: 18,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#6B3FA0',
  },
});
