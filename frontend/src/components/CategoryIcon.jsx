
import React from 'react';
import { 
    SprayCan, Sprout, Leaf, Droplets, FlaskConical, Bug, 
    Hammer, Fuel, Truck, Package, Archive, Layers, Tags, ShoppingCart 
} from 'lucide-react';

const CategoryIcon = ({ name, size = 16, className = "" }) => {
    const icons = {
        'SprayCan': SprayCan,
        'Sprout': Sprout,
        'Leaf': Leaf,
        'Droplets': Droplets,
        'FlaskConical': FlaskConical,
        'Bug': Bug,
        'Hammer': Hammer,
        'Fuel': Fuel,
        'Truck': Truck,
        'Package': Package,
        'Archive': Archive,
        'Layers': Layers,
        'Tags': Tags,
        'ShoppingCart': ShoppingCart
    };
    
    const IconComponent = icons[name] || Package;
    return <IconComponent size={size} className={className} />;
};

export default CategoryIcon;
