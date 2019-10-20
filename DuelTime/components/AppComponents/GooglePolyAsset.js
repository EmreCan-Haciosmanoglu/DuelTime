import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet } from 'react-native';

export default class GooglePolyAsset extends React.Component {
    state = {}

    static defaultProps = {
        asset: {},
        onPress: () => { },
    }

    render() {
        return (
            <TouchableOpacity style={styles.container} onPress={this.props.onPress} >
                <Image
                    source={{ url: this.props.asset.thumbnail.url }}
                    style={styles.thumbnail}
                />
                <Text style={styles.displayName} >
                    {this.props.asset.displayName}
                </Text>
                <Text style={styles.authorName} >
                    {this.props.asset.authorName}
                </Text>
            </TouchableOpacity>
        );
    }
}

const styles = StyleSheet.create({
    thumbnail: { width: 150, height: 150, borderRadius: 10 },
    displayName: { fontWeight: "bold" },
    authorName: {},
    container: { alignItems: "center" },
});