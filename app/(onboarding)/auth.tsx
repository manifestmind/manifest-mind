import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAuthToast } from '../../components/ui/AuthToast';
import { auth } from '../../services/firebase';
import { signInWithGoogle } from '../../services/googleAuth';
import { finalizeSignIn } from '../../services/authSession';
import { useTranslation } from '../../src/hooks/useTranslation';


export default function Auth() {
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [googleBusy, setGoogleBusy] = useState(false);

  const handleAppleSignIn = () => {
    // Stub inchangé (OAuth Apple à implémenter en session dédiée) — on rend juste
    // le message visible sur web via le toast au lieu d'une Alert muette.
    showAuthToast(`${t.auth.alertApple.titre} — ${t.auth.alertApple.corps}`, 'info');
  };

  const handleGoogleSignIn = async () => {
    if (googleBusy) return; // évite un 2e popup (auth/cancelled-popup-request)
    setGoogleBusy(true);
    const res = await signInWithGoogle();
    setGoogleBusy(false);

    switch (res.status) {
      case 'signed-in':
        // Session établie : useSubscriptionSync (monté dans _layout) purge les
        // droits de l'identité précédente puis resynchronise subscription_active
        // depuis users/{uid}. Le paywall est décidé en aval par le gate de home.
        await finalizeSignIn();
        return;
      case 'redirecting':
        // La page part chez Google ; le retour est traité au démarrage par
        // getRedirectResult (_layout.tsx). Rien à afficher.
        return;
      case 'cancelled':
        // L'utilisateur a fermé le popup — silence, pas d'erreur.
        return;
      case 'unsupported':
        // Native : signInWithPopup n'existe pas en React Native.
        showAuthToast(`${t.auth.alertGoogle.titre} — ${t.auth.alertGoogle.corps}`, 'info');
        return;
      default:
        showAuthToast(
          res.code === 'auth/network-request-failed' ? t.auth.googleReseau : t.auth.googleErreur,
          'error',
        );
    }
  };

  // Reconnexion directe email + mot de passe. C'est l'usage principal de cet
  // écran : un utilisateur qui revient tape ses identifiants et rentre TOUT DE
  // SUITE, sans boîte mail. signInWithEmailAndPassword bascule sur le bon UID
  // (l'anonyme d'essai est abandonné) → useSubscriptionSync purge l'identité
  // précédente puis restaure subscription_active depuis Firestore. finalizeSignIn
  // route vers splash (et initialise les clés de cycle si absentes).
  const handlePasswordSignIn = async () => {
    if (busy) return;
    if (Date.now() < cooldownUntil) {
      showAuthToast(t.auth.erreurTropDeTentatives, 'error');
      return;
    }
    const mail = email.trim().toLowerCase();
    if (!mail || !password) return;
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, mail, password);
      setFailedAttempts(0);
      setPassword('');
      await finalizeSignIn();
    } catch (error: any) {
      const code: string = error?.code ?? '';
      if (__DEV__) console.log('[auth] signInWithEmailAndPassword échoué', code);
      setBusy(false);
      if (code === 'auth/network-request-failed') {
        showAuthToast(`${t.auth.alertErreurReseau.titre} — ${t.auth.alertErreurReseau.corps}`, 'error');
        return;
      }
      if (code === 'auth/too-many-requests') {
        setCooldownUntil(Date.now() + 30_000);
        setFailedAttempts(0);
        showAuthToast(t.auth.erreurTropDeTentatives, 'error');
        return;
      }
      // La protection anti-énumération de Firebase regroupe mauvais mot de passe,
      // e-mail inconnu et compte Google-only sous auth/invalid-credential. Un seul
      // message honnête, qui oriente vers « mot de passe oublié » ou Google.
      const next = failedAttempts + 1;
      setFailedAttempts(next);
      if (next >= 3) {
        setCooldownUntil(Date.now() + 30_000);
        setFailedAttempts(0);
      }
      showAuthToast(t.auth.erreurIdentifiants, 'error');
    }
  };

  // « Mot de passe oublié ou jamais défini ? » — envoie l'e-mail de définition de
  // mot de passe. Test décisif validé (2026-07-15) : sur un compte créé par magic
  // link (sans mot de passe), sendPasswordResetEmail POSE bien un mot de passe,
  // UID conservé. C'est le pont pour les anciens comptes magic-link.
  const handlePasswordReset = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail) {
      showAuthToast(t.auth.emailManquantReset, 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, mail);
    } catch (error: any) {
      const code: string = error?.code ?? '';
      if (code === 'auth/invalid-email') {
        showAuthToast(t.compte.errEmailInvalide, 'error');
        return;
      }
      if (code === 'auth/network-request-failed') {
        showAuthToast(`${t.auth.alertErreurReseau.titre} — ${t.auth.alertErreurReseau.corps}`, 'error');
        return;
      }
      // Autres cas (dont compte inexistant) : la protection anti-énumération fait
      // renvoyer un succès sans révéler si l'e-mail existe. On affiche donc le même
      // message positif que sur un vrai succès.
    }
    showAuthToast(`${t.auth.resetEnvoye.titre} — ${t.auth.resetEnvoye.corps}`, 'success');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#F0EAE0' }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 18), paddingBottom: Math.max(insets.bottom, 14) }]}
        keyboardShouldPersistTaps="handled"
      >
      <View style={[styles.orb, {
        width: 140,
        height: 140,
        backgroundColor: '#C4A8D4',
        opacity: 0.25,
        top: -20,
        right: -20,
      }]} />
      <View style={[styles.orb, {
        width: 80,
        height: 80,
        backgroundColor: '#C4E8F0',
        opacity: 0.25,
        bottom: 24,
        left: -12,
      }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Svg width={148} height={113} viewBox="0 0 56 44">
            <Defs>
              <ClipPath id="ec1">
                <Path d="M8 22 Q28 6 48 22 Q28 38 8 22Z" />
              </ClipPath>
            </Defs>
            <Ellipse cx="28" cy="22" rx="20" ry="13"
              fill="none" stroke="#C4A8D4"
              strokeWidth="0.4" opacity="0.5" />
            <Ellipse cx="28" cy="22" rx="17" ry="11"
              fill="none" stroke="#9B72C8"
              strokeWidth="0.3" opacity="0.3" />
            <Path
              d="M8 22 Q28 6 48 22 Q28 38 8 22Z"
              fill="#FAF6F0" />
            <Circle cx="28" cy="22" r="10.5"
              fill="#DDD0F8"
              clipPath="url(#ec1)" />
            <Circle cx="28" cy="22" r="8"
              fill="#9B72C8" opacity="0.75"
              clipPath="url(#ec1)" />
            <Circle cx="28" cy="22" r="5.8"
              fill="#6B3FA0" opacity="0.9"
              clipPath="url(#ec1)" />
            <Circle cx="28" cy="22" r="3"
              fill="#1A0E30"
              clipPath="url(#ec1)" />
            <Circle cx="30.5" cy="19.5" r="1.3"
              fill="white" opacity="0.9"
              clipPath="url(#ec1)" />
            <Circle cx="25.5" cy="23.5" r="0.6"
              fill="white" opacity="0.5"
              clipPath="url(#ec1)" />
            <Circle cx="28" cy="15.5" r="1.8"
              fill="#EAC870"
              clipPath="url(#ec1)" />
            <Circle cx="28" cy="15.5" r="0.8"
              fill="#C89A30"
              clipPath="url(#ec1)" />
            <Path
              d="M8 22 Q28 6 48 22"
              fill="none" stroke="#3A2850"
              strokeWidth="1.4"
              strokeLinecap="round" />
            <Path
              d="M8 22 Q28 38 48 22"
              fill="none" stroke="#3A2850"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.5" />
            <Circle cx="8" cy="22" r="1"
              fill="#C4A8D4" opacity="0.6" />
            <Circle cx="48" cy="22" r="1"
              fill="#C4A8D4" opacity="0.6" />
          </Svg>
          <Text style={styles.title}>{t.auth.titre}</Text>
          <Text style={styles.subtitle}>{t.auth.sousTitre}</Text>
        </View>

        <View style={styles.buttonsContainer}>
          {/* Apple Sign-In : coquille vide (handleAppleSignIn = toast). Le câblage
              web exige un compte Apple Developer payant, qu'on n'a pas encore →
              masqué sur web pour ne pas proposer un bouton qui ne fait rien.
              Code conservé : il reprend vie en Phase 2 (App Store), où Apple
              IMPOSE son sign-in dès qu'on propose Google. Sur web, Google +
              email/magic link suffisent. */}
          {Platform.OS !== 'web' ? (
            <Pressable style={styles.appleButton} onPress={handleAppleSignIn}>
              <Svg width="14" height="14" viewBox="0 0 18 18">
                <Path d="M14.5 9.5c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.7-3.1.7-.7 0-1.7-.7-2.8-.7-1.4 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.2 2.6 2.1 1-.04 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7 1.1-.02 1.8-1.1 2.5-2.1.8-1.2 1.1-2.3 1.1-2.4-.04-.01-2.1-.8-2.1-3.4z" fill="white"/>
              </Svg>
              <Text style={styles.appleButtonText}>{t.auth.apple}</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={[styles.googleButton, googleBusy && { opacity: 0.5 }]}
            onPress={handleGoogleSignIn}
            disabled={googleBusy}
          >
            <Svg width="14" height="14" viewBox="0 0 18 18">
              <Path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <Path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <Path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <Path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </Svg>
            <Text style={styles.googleButtonText}>{t.auth.google}</Text>
          </Pressable>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>{t.commun.ou}</Text>
            <View style={styles.separatorLine} />
          </View>

          <View style={styles.emailContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder={t.auth.placeholder}
              placeholderTextColor="#A09088"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.emailInput}
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor="#A09088"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              style={[styles.sendButton, (busy || Date.now() < cooldownUntil) && { opacity: 0.4 }]}
              onPress={handlePasswordSignIn}
              disabled={busy || !email.trim() || !password || Date.now() < cooldownUntil}
            >
              <Text style={styles.sendButtonText}>{t.auth.seConnecter}</Text>
            </Pressable>
            <Pressable style={styles.forgotLink} onPress={handlePasswordReset}>
              <Text style={styles.forgotText}>{t.auth.motDePasseOublie}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.bottomBlock}>
        <View style={styles.dotsNav}>
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={styles.dotNav} />
          <View style={[styles.dotNav, styles.dotNavOn]} />
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F0EAE0',
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
  },
  buttonsContainer: {
    gap: 9,
    marginTop: 32,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 39,
    fontStyle: 'italic',
    color: '#2A2520',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Jost',
    fontSize: 16.5,
    fontWeight: '300',
    color: '#7A7068',
    textAlign: 'center',
    lineHeight: 16,
  },
  appleButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 999,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appleButtonText: {
    fontFamily: 'Jost',
    fontSize: 16.5,
    fontWeight: '400',
    color: 'white',
  },
  googleButton: {
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: '#D4C4B8',
    borderRadius: 999,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleButtonText: {
    fontFamily: 'Jost',
    fontSize: 16.5,
    fontWeight: '400',
    color: '#2A2520',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separatorLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#D4C4B8',
  },
  separatorText: {
    fontFamily: 'Jost',
    fontSize: 15,
    color: '#A09088',
  },
  emailButton: {
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    borderRadius: 999,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emailButtonText: {
    fontFamily: 'Jost',
    fontSize: 16.5,
    fontWeight: '400',
    color: '#6B3FA0',
  },
  emailContainer: {
    gap: 8,
  },
  emailInput: {
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: '#C4A8D4',
    borderRadius: 12,
    padding: 12,
    fontSize: 21,
    color: '#2A2520',
  },
  sendButton: {
    backgroundColor: '#3A3530',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#F0EAE0',
    fontSize: 21,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  forgotLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: 'Jost',
    fontSize: 14,
    color: '#6B3FA0',
    textAlign: 'center',
  },
  bottomBlock: {
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
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
