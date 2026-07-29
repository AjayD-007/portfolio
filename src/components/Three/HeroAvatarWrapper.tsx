"use client";

import dynamic from 'next/dynamic';
import React, { useState, useEffect } from 'react';

const HeroAvatarCanvas = dynamic(
  () => import('@/components/Three/HeroAvatar').then(mod => mod.HeroAvatarCanvas),
  { ssr: false }
);

export default function HeroAvatarWrapper() {
  return <HeroAvatarCanvas />;
}
